export function hashString(value: string): number {
	let hash = 0;

	for (let index = 0; index < value.length; index += 1) {
		let chunk = value.charCodeAt(index);
		chunk = Math.imul(chunk, 0xcc9e2d51);
		chunk = (chunk << 15) | (chunk >>> 17);
		chunk = Math.imul(chunk, 0x1b873593);
		hash ^= chunk;
		hash = (hash << 13) | (hash >>> 19);
		hash = (Math.imul(hash, 5) + 0xe6546b64) | 0;
	}

	hash ^= value.length;
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 0x85ebca6b);
	hash ^= hash >>> 13;
	hash = Math.imul(hash, 0xc2b2ae35);
	hash ^= hash >>> 16;

	return hash >>> 0;
}
