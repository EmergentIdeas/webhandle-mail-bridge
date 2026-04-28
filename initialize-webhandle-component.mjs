import createInitializeWebhandleComponent from "@webhandle/initialize-webhandle-component/create-initialize-webhandle-component.mjs"
import ComponentManager from "@webhandle/initialize-webhandle-component/component-manager.mjs"
import createCreateFormHandler from "./create-form-handler.mjs"
import path from "node:path"
import filog from 'filter-log'
let log = filog('webhandle:mail-bridge')

import Sender from "./sender.mjs"

const initializeWebhandleComponent = createInitializeWebhandleComponent()

initializeWebhandleComponent.componentName = '@webhandle/mail-bridge'
initializeWebhandleComponent.componentDir = import.meta.dirname
initializeWebhandleComponent.defaultConfig = {
	"publicFilesPrefix": '/' + initializeWebhandleComponent.componentName + "/files"
	, "alwaysProvideResources": false

	, "transport": {
		"host": "smtp.host.com",
		"port": 587,
		"secure": false, // true for 465, false for other ports
		"auth": {
			"user": "user",
			"pass": "password"
		}
	}
	, "destDefault": "dan@example.com"
	, "from": "dan@example.com"
	, "dbCollectionName": "webhandle_mail_bridge_messages"
	/*
	, "dbName": "db1"	
		"grecaptchaPublic": "public key",
		"grecaptchaPrivate": "private key"
	*/
	, requiredGrecaptchaScore: .5
	, successResponse: "/thank-you"
	, failureResponse: "/could-not-send-message"
}
initializeWebhandleComponent.staticFilePath = 'public'
initializeWebhandleComponent.templatePath = 'views'

function getDb(webhandle, name) {
	if(!name) {
		return webhandle.primaryDatabase?.db
	}
	return webhandle.dbs?.[name]?.db
}

initializeWebhandleComponent.setup = async function (webhandle, config) {
	let manager = new ComponentManager()
	manager.config = config
	
	manager.services.sender = new Sender({
		transport: config.transport
		, destDefault: config.defaultConfig
	})
	

	let db = getDb(webhandle, config.dbName)

	
	let saver
	if(db && config.dbCollectionName) {
		let collection = db.collection(config.dbCollectionName)
		saver = {
			async save(email) {
				await collection.insertOne(email)
			}
		}
	}

	manager.createFormHandler = createCreateFormHandler({
		sender: manager.services.sender
		, webhandle: webhandle
		, saver
		, grecaptchaPrivate: config.grecaptchaPrivate
		, requiredGrecaptchaScore: config.requiredGrecaptchaScore
		, to: config.destDefault
		, from: config.from || config.transport?.auth?.user
		, successResponse: config.successResponse
		, failureResponse: config.failureResponse
		, processFields: config.processFields
		, processMessage: config.processMessage
	})

	webhandle.routers.preDynamic.use((req, res, next) => {
		if (config.alwaysProvideResources || !initializeWebhandleComponent.supportsMultipleImportMaps(req)) {
			manager.addExternalResources(res.locals.externalResourceManager)
		}
		next()
	})

	manager.addExternalResources = (externalResourceManager, options) => {
		externalResourceManager.provideResource({
			mimeType: 'application/javascript'
			, resourceType: 'module'
			, name: initializeWebhandleComponent.componentName + '/configuration'
			, data: { grecaptchaPublic: config.grecaptchaPublic }
		})

		externalResourceManager.provideResource({
			url: config.publicFilesPrefix + '/js/make-form-recaptcha.mjs'
			, mimeType: 'application/javascript'
			, resourceType: 'module'
			, name: initializeWebhandleComponent.componentName
		})
	}

	webhandle.addTemplate(initializeWebhandleComponent.componentName + '/addExternalResources', (data) => {
		let externalResourceManager = initializeWebhandleComponent.getExternalResourceManager(data)
		manager.addExternalResources(externalResourceManager)
	})

	webhandle.addTemplate(initializeWebhandleComponent.componentName + '/makeFormsRecaptcha', (data) => {
		try {
			let externalResourceManager = initializeWebhandleComponent.getExternalResourceManager(data)
			manager.addExternalResources(externalResourceManager)

			let resources = externalResourceManager.render()
			let action = `
	<script type="module">
			import mailBridgeConfig from "${initializeWebhandleComponent.componentName}/configuration"
			import { addGrecaptchaToForms } from "${initializeWebhandleComponent.componentName}"
			addGrecaptchaToForms(mailBridgeConfig.grecaptchaPublic)
	</script>`

			return resources + action
		}
		catch (e) {
			console.error(e)
		}
	})

	// Allow access to the component and style code
	let filePath = path.join(initializeWebhandleComponent.componentDir, initializeWebhandleComponent.staticFilePath)
	manager.staticPaths.push(
		webhandle.addStaticDir(
			filePath,
			{
				urlPrefix: config.publicFilesPrefix
				, fixedSetOfFiles: true
			}
		)
	)

	return manager
}

export default initializeWebhandleComponent
