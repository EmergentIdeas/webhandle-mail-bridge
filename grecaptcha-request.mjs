import https from "https"
import filog from "filter-log"

let log = filog('webhandle:mail-bridge')

export default async function recaptchaRequest(privateKey, token) {

	return new Promise((resolve, reject) => {

		let data = 'secret=' + encodeURIComponent(privateKey) + '&response=' + encodeURIComponent(token)

		const options = {
			hostname: 'www.google.com',
			port: 443,
			path: '/recaptcha/api/siteverify',
			method: 'POST'
			, headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length
			}
		}

		const req = https.request(options, (res) => {
			res.on('data', (d) => {
				if (typeof d == 'string' || Buffer.isBuffer(d)) {
					try {
						d = JSON.parse(d)
					}
					catch (e) {
						reject(e)
					}
				}
				resolve(d)
			})
		})

		req.on('error', (error) => {
			log.error(error)
			reject(error)
		})

		req.write(data)
		req.end()
	})
}
