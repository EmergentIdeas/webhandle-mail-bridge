import setupMailBridge from "../initialize-webhandle-component.mjs"
import { serverTestCredentials } from "../test-conf/test-email-credentials.mjs"

export default async function setup(webhandle) {
	webhandle.development = true

	
	
	let managerMailBridge = await setupMailBridge(webhandle)
	
	let handler = managerMailBridge.createFormHandler({
		to: serverTestCredentials.to
		, "from": serverTestCredentials.from
		, subject: () => 'this is your test ' + (new Date())
		, messageType: "main-page"
		, emailTemplateName: 'index-form-email'
	})
	
	webhandle.routers.primary.post('/contact', handler)
	
	
	

}