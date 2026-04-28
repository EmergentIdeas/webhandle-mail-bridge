import grecaptchaRequest from "./grecaptcha-request.mjs"

/**
 * 
 * @param {object} options 
 * @param {string} options.grecaptchaPrivate
 * @param {number} options.requiredGrecaptchaScore
 * @returns 
 */
export default function createCheckGrecaptcha(options) {

	return async function (req) {
		if (options.grecaptchaPrivate) {
			let answer = await grecaptchaRequest(options.grecaptchaPrivate, req.body.grt)
			if (answer.success && answer.score >= options.requiredGrecaptchaScore) {
				return true
			}
			else {
				return false
			}
		}
		return true
	}
}