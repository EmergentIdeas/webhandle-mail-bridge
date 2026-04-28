import cleanse from "./cleanse.mjs";


export default function createMessageCreator(webhandle, templateName) {
	/**
	 * 
	 * @param {object} [data] The data to render with the template
	 * @returns the message html
	 */
	return async function (data) {
		let msg = await webhandle.render(templateName, data)
		return msg
	}
}
