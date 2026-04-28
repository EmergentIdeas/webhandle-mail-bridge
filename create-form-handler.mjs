import cleanse from "./cleanse.mjs"
import spamcheck from "./is-spam.mjs"
import createCheckGrecaptcha from "./create-check-grecaptcha.mjs"
import createMessageCreator from "./message-creator.mjs"
import findFirstNotNullValue from "./first-non-null-value.mjs"

import filog from 'filter-log'
let log = filog('webhandle:mail-bridge')

let defaults = {
	requiredGrecaptchaScore: .5
}

function createCleanOptionsForSave(options) {

	let o = Object.assign({}, options)
	delete o.webhandle
	delete o.processFields
	delete o.processMessage
	delete o.saver
	delete o.sender
	delete o.grecaptchaPrivate
	
	return o
}

/**
 * 
 * @param {object} options 
 * @param {Sender} options.sender Sends the email
 * @param {object} options.saver Saves the email
 * @param {string} options.grecaptchaPrivate
 * @param {number} options.requiredGrecaptchaScore
 * @param {Webhandle} options.webhandle
 * @param {function(object)} options.processFields A chance to change the fields, run before spam check
 * @param {function(object)} options.processMessage A chance to change the message, run before the html is generated
 * @param {string|function} options.successResponse What to do on a successful send. Either a url string or a function
 * which handles the response
 * @param {string|function} options.failureResponse What to do on a failed send. Either a url string or a function
 * which handles the response
 */
export default function createCreateFormHandler(options = {}) {
	

	/**
	 * @param {object} options
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
	 * 
	 */
	return function createFormHandler(handlerOptions) {
		
		let combined = Object.assign({}, defaults, options, handlerOptions)
		
		let checkGrecaptcha = createCheckGrecaptcha({
			grecaptchaPrivate: options.grecaptchaPrivate
			, requiredGrecaptchaScore: options.requiredGrecaptchaScore
		})
		
		let {sender, saver, to, from, subject, emailTemplateName, webhandle, processFields, processMessage, replyTo, attachments} = combined
		let messageCreator = createMessageCreator(webhandle, emailTemplateName)
		
		if(!replyTo) {
			replyTo = (fields) => fields.email
		}

		return async function(req, res, next) {
			
			let fields = req.body
			fields = cleanse(fields, {})
			
			try {
				await spamcheck(fields)
				
				if (processFields) {
					let ret = processFields(fields)
					if (ret) {
						fields = ret
					}
				}
				if(! (await checkGrecaptcha(req))) {
					throw new Error('Failed google recaptcha test')
				}

				let message = {
					subject: await findFirstNotNullValue([subject, 'Contact from the website'], [fields, combined])
					, from: await findFirstNotNullValue([from, sender.transport.auth.user], [fields, combined])
					, to: await findFirstNotNullValue([to, sender.destDefault], [fields, combined])
					, replyTo: await findFirstNotNullValue([replyTo], [fields, combined])
					, attachments: await findFirstNotNullValue([attachments], [fields, combined])
				}
				
				
				if (processMessage) {
					let ret = processMessage(message)
					if (ret) {
						message = ret
					}
				}
				
				if(!message.html) {
					message.html = await messageCreator(fields)
				}
				
				try {
					await sender.sendEmail(message)
					if(saver) {
						await saver.save({
							fields
							, message
							, options: createCleanOptionsForSave(combined)
						})
					}
					
					if(options.successResponse) {
						if(typeof options.successResponse === 'string') {
							return res.redirect(options.successResponse)
						}
						else if(typeof options.successResponse === 'function') {
							return options.successResponse(req, res, next)
						}
					}
				}
				catch(e) {
					log.error(e)
				}
			}
			catch(e) {
				log.error(e)
			}
			
			if(options.failureResponse) {
				if(typeof options.failureResponse === 'string') {
					return res.redirect(options.failureResponse)
				}
				else if(typeof options.failureResponse === 'function') {
					return options.failureResponse(req, res, next)
				}
			}
		}
	}
}