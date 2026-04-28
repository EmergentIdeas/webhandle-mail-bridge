# @webhandle/mail-bridge

A webhandle component to make it easy to send mail and handle
contact forms, with google recpatcha, spam checking, submitted
information cleaning, and message archiving.


## Install

```bash
npm install @webhandle/mail-bridge
```

## Configuration

```json
{
	"@webhandle/mail-bridge": {
		"transport": {
			"host": "email-smtp.us-east-1.amazonaws.com",
			"port": 587,
			"secure": false,
			"auth": {
				"user": "username",
				"pass": "password"
			}
		},
		"destDefault": "dan@example.com",
		"grecaptchaPublic": "public recaptcha key",
		"grecaptchaPrivate": "private recaptcha key",
		"from": "server@example.com"
		, "dbName": "db1"	
		, "dbCollectionName": "webhandle_mail_bridge_messages"
		, "requiredGrecaptchaScore": .5
		, "successResponse": "/thank-you"
		, "failureResponse": "/could-not-send-message"
	}
}
```

Really only the `transport`, `destDefault`, and `from` fields are needed. Everything else has
sensible defaults, including using the webhandle primary database if one exists. `successResponse`
and `failureRespose` can be urls or functions with the express handler signature.

## Initialization

```js
	import setupMailBridge from "@webhandle/mail-bridge/initialize-webhandle-component.mjs"
	let managerMailBridge = await setupMailBridge(webhandle)
```


## Usage

To send an email:

```js
await managerMailBridge.services.sender.sendEmail({
	to: 'dansomething@example.com'
	, from: 'server@exmpale.com'
	, subject: function() { return 'test2 ' + new Date() }
	, html: '<h1>Test</h1><p>This is a test.</p>'
})

```


To set up a url endpoint to handle a form:

```js
let handler = managerMailBridge.createFormHandler({
	to: "dan@emergentideas.com"
	, "from": "server@emergentideas.com"
	, messageType: "main-page"
	, emailTemplateName: 'index-form-email'
})

webhandle.routers.primary.post('/contact', handler)
```

Any option on the configuration can also be passed to the `createFormHandler` function which will
override the previous setting for this endpoint.

The normal options for the endpoint are:

```js
/**
 * @param {string|function} options.to The destination email address
 * @param {string|function} options.from The source email address
 * @param {string|function} options.subject The email subject line
 * @param {string|function} options.replyTo The email subject line
 * @param {string|function} options.attachments The email subject line
 * @param {string} options.emailTemplateName The name of the template to use to render the email
 * @param {string|function} options.successResponse What to do on a successful send. Either a url string or a function
 * which handles the response
 * @param {string|function} options.failureResponse What to do on a failed send. Either a url string or a function
 * which handles the response
*/
```

The email looks like below where the fields are available: 

```html
<!DOCTYPE html>
<html>
	<body>
		
		<p>
			Name: __name__
		</p>
		<p>
			Email: __email__
		</p>
		<p>
			Message: __message__
		</p>
	</body>
</html>

```

To set up a form which uses the grecaptcha functionality, you just need to provide the form a class and include
a template:

```html
<form action="/contact" method="post" class="google-recaptcha-form">
	<label>
		Name
		<input name="name" type="text" required />	
	</label>
	<label>
		Email
		<input name="email" type="text" required />	
	</label>
	<label>
		Message
		<textarea name="message"></textarea>
	</label>
	
	<br>
	<button type="submit">Send</button>
</form>

__::@webhandle/mail-bridge/makeFormsRecaptcha__
```

