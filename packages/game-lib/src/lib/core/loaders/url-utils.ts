export function stripUrlSearchAndHash(url: string): string {
	const queryStart = url.indexOf('?');
	const hashStart = url.indexOf('#');
	const end = [queryStart, hashStart]
		.filter((index) => index >= 0)
		.reduce((min, index) => Math.min(min, index), url.length);

	return url.slice(0, end);
}

export function getUrlFileName(url: string): string {
	const normalizedUrl = stripUrlSearchAndHash(url);
	const lastSlashIndex = Math.max(
		normalizedUrl.lastIndexOf('/'),
		normalizedUrl.lastIndexOf('\\'),
	);
	return lastSlashIndex >= 0
		? normalizedUrl.slice(lastSlashIndex + 1)
		: normalizedUrl;
}

export function getUrlDirectory(url: string): string {
	const normalizedUrl = stripUrlSearchAndHash(url);
	const lastSlashIndex = Math.max(
		normalizedUrl.lastIndexOf('/'),
		normalizedUrl.lastIndexOf('\\'),
	);
	if (lastSlashIndex < 0) {
		return '';
	}
	return url.slice(0, lastSlashIndex + 1);
}

export function getUrlFileExtension(url: string): string | null {
	const fileName = getUrlFileName(url);
	const extensionIndex = fileName.lastIndexOf('.');

	if (extensionIndex < 0 || extensionIndex === fileName.length - 1) {
		return null;
	}

	return fileName.slice(extensionIndex + 1).toLowerCase();
}

/**
 * Resolve a resource named by a model file (an OBJ `mtllib`, a glTF buffer)
 * against that file's URL. Absolute resource URLs are returned unchanged.
 */
export function resolveAgainstFileUrl(resource: string, fileUrl: string): string {
	if (/^[a-z][a-z\d+.-]*:/i.test(resource) || resource.startsWith('//')) {
		return resource;
	}

	try {
		return new URL(resource, fileUrl).toString();
	} catch {
		return `${getUrlDirectory(fileUrl)}${resource}`;
	}
}
