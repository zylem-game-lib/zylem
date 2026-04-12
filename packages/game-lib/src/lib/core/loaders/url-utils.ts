export function stripUrlSearchAndHash(url: string): string {
	const queryStart = url.indexOf('?');
	const hashStart = url.indexOf('#');
	const end = [queryStart, hashStart]
		.filter((index) => index >= 0)
		.reduce((min, index) => Math.min(min, index), url.length);

	return url.slice(0, end);
}

export function getUrlFileExtension(url: string): string | null {
	const normalizedUrl = stripUrlSearchAndHash(url);
	const lastSlashIndex = normalizedUrl.lastIndexOf('/');
	const fileName = lastSlashIndex >= 0
		? normalizedUrl.slice(lastSlashIndex + 1)
		: normalizedUrl;
	const extensionIndex = fileName.lastIndexOf('.');

	if (extensionIndex < 0 || extensionIndex === fileName.length - 1) {
		return null;
	}

	return fileName.slice(extensionIndex + 1).toLowerCase();
}
