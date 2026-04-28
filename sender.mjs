import nodemailer from "nodemailer"
import findFirstNotNullValue from "./first-non-null-value.mjs"
import filog from 'filter-log'
let log = filog('webhandle:mail-bridge')

export default class Sender {


	/**
	 * ```{
				transport: {
					host: "smtp.office365.com",
					port: 587,
					secure: false, // true for 465, false for other ports
					auth: {
						user: 'username',
						pass: 'pass'
					}
				},
				destDefault: "dan@example.com"
			}
		``` 
	 * @param {*} options 
	 */

	constructor(options) {
		Object.assign(this, options)
		this.mailer = nodemailer.createTransport(this.transport)
	}

	findFirstNotNullValue = findFirstNotNullValue

	/**
	 * 
	 * @param {object} message The message to send
	 * @param {string} [message.to] String of destination addresses. Use a string of comma separated values for
	 * multiple recipients
	 * @param {string} [message.replyTo] Add a different reply to other than the sender
	 * @param {string|function} [message.from] The from address. Frequently left black where the sending service requires a specific address.
	 * @param {string|function} message.subject The subject to use or a function which creates the subject
	 * @param {string} [message.emailTemplate] The name of the template to use
	 * @param {string} [message.html] The text of the message to send. Use this or emailTemplate
	 * @param {array} [message.attachments] 
	 * @param {object} [options]
	 * @param {function} [options.preRenderProcessor] A first pass to examine or change the mail options,the to, from, subject, replyTo, etc.
	 * (mailOptions, mesage, options)
	 * @param {function} [options.preSendProcessor] Last chance to modify the mail options before the email is sent (mailOptions, req, options)
	 * @returns 
	 */
	async sendEmail(message, options = {}) {
		let mailOptions = {
			subject: await this.findFirstNotNullValue([message.subject, 'Contact from the website'], [message, options])
			, from: await this.findFirstNotNullValue([message.from, this.transport.auth.user], [message, options])
			, to: await this.findFirstNotNullValue([message.to, this.destDefault], [message, options])
			, replyTo: await this.findFirstNotNullValue([message.replyTo], [message, options])
		}
		if (message.attachments) {
			mailOptions.attachments = await this.findFirstNotNullValue([message.attachments], [message, options])
		}

		if (options.preRenderProcessor) {
			options.preRenderProcessor(mailOptions, message, options, dat)
		}

		mailOptions.html = message.html

		if (options.preSendProcessor) {
			options.preSendProcessor(mailOptions, req, options)
		}

		try {
			let info = await this.mailer.sendMail(mailOptions)

			log.info({
				message: 'Email sent',
				response: info.response,
				contents: mailOptions,
			})
		}
		catch (e) {
			log.error('Could not send email.')
			log.error({
				message: 'Email lost',
				contents: mailOptions,
				err: e
			})
			throw e
		}
	}
}
