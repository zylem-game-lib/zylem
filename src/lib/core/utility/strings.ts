export function sortedStringify(obj: Record<string, any>) {
	const sortedObj = Object.keys(obj)
		.sort()
		.reduce((acc: Record<string, any>, key: string) => {
			acc[key] = obj[key];
			return acc;
		}, {} as Record<string, any>);

	return JSON.stringify(sortedObj);
}

export function shortHash(objString: string) {
	let hash = 0;
	for (let i = 0; i < objString.length; i++) {
		hash = Math.imul(31, hash) + objString.charCodeAt(i) | 0;
	}
	return hash.toString(36);
}