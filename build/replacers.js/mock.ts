import { AliasReplacerArguments } from 'tsc-alias'

/**
 * Replace the paths within the '.mock' folder into the relative path expected at runtime.
 * We use a RegExp to achieve this, could be another approach
 */
const re = /[^'"`]*\/\.mock\//

export default function mockReplacer({
	orig,
	// file,
	// config,
}: AliasReplacerArguments): string {
	if (re.test(orig)) {
		// console.log({ orig })
		// count the number of '..' before '.mock' folder
		const nbParents = (orig.match(/\.\.\//g) || []).length
		const replaced = orig.replace(re, '../'.repeat(3 + nbParents))
		// console.log({ replaced })
		return replaced
	}
	return orig
}
