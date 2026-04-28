
export let blacklisted = [
	"bestadultdating", 
	"sex in your city", 
	"Meet sexy girls",
	"Beautiful women", 
	"for sex in",
	"Looking for a boyfriend",
	"Beautiful girls",
	"Bitcoin", 
	"sex", 
	"sexy", 
	"dating", 
	"flirting",
	"viagra",
	"epileptogenesis",
	"ketoacidosis",
	"celiac",
	"webcam",
	"https:",
	"http:",
	"fuck"
]



export default function spamcheck(emailData) {
	
	let txt = JSON.stringify(emailData).toLowerCase()
	
	if(emailData.email) {
		if(emailData.email.toLowerCase().endsWith('.ru')) {
			return new Error('email address ends with ru')
		}
		if(emailData.email.toLowerCase().indexOf('.site') > -1) {
			return new Error('email address ends with site')
		}
		if(emailData.email.toLowerCase().indexOf('mail.ru') > -1) {
			return new Error('email address ends with site')
		}
		if(emailData.email.toLowerCase().indexOf('href') > -1) {
			return new Error('email address has href')
		}
		if(emailData.email.toLowerCase().indexOf('<') > -1) {
			return new Error('email address has gt')
		}
	}
	for(let phrase of blacklisted) {
		if(txt.indexOf(phrase.toLowerCase()) > -1) {
			return new Error('Found blacklisted term: ' + phrase)
		}
	}
	if(txt.indexOf('@mail.ru') > -1) {
		return new Error('Form contains @mail.ru')
	}
}
