
export default function isValueTrue(context) {
	if (typeof context == 'undefined') {
		return false
	}

	if (context === null || context === undefined || context === false) {
		return false
	}

	if (typeof context == 'string') {
		if (context) {
			return true
		}
		return false
	}
	if (typeof context == 'object') {
		return true
	}
	if (typeof context == 'array') {
		return context.length > 0
	}

	return false
}