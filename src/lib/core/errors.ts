export class EntityErrors {

	errorEntityBody(): string {
		const error = `body missing for entity ${this.toString()}`;
		console.warn(error);
		return error;
	}

	errorIncompatibleFileType(extension: string = 'unknown'): string {
		const error = `attempted to load data from a ${extension} file for entity ${this.toString()}, this file type is unsupported at the moment`;
		console.warn(error);
		return error;
	}
}