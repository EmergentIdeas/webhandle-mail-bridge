import striptags from 'striptags'

/**
 * Strips tags from the members of `fields`
 * @param {object} fields 
 * @returns 
 */
export default function cleanse(fields) {
	let o = Object.assign({}, fields)
	for (let key of Object.keys(o)) {
		if (typeof o[key] == 'string') {
			o[key] = striptags(o[key])
		}
		else if (Array.isArray(o[key])) {
			for (let i = 0; i < o[key].length; i++) {
				o[key][i] = striptags(o[key][i])
			}
		}
	}

	return o
}