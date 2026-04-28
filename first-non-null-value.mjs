
export default async function findFirstNotNullValue(candidates, fArgs) {
	for (let candidate of candidates) {
		if (candidate) {
			if (typeof candidate === 'string') {
				return candidate
			}
			if (typeof candidate === 'function') {
				return await candidate(...fArgs)
			}
		}
	}
	return null
}