export class Exception extends Error {
	status: number;
	url: string;

	constructor({
		url,
		status,
		statusText
	}: Record<'url' | 'statusText', string> & { status: number }) {
		super(statusText);
		this.url = url;
		this.status = status;
	}
}

export class ReferencingNotFound extends Error {
	constructor() {
		super(`Member 'referencing' has not been found for domain`);
	}
}

export class TilesetNotFound extends Error {
	constructor(indices: Record<string, number> | number[]) {
		super(`No tileSet for indices:${JSON.stringify(indices)} found`);
	}
}

export class InvalidDateRepresentation extends Error {
	constructor(expectedFormat: string, value: string) {
		super(`Expected a date[time] string in format ${expectedFormat} but got: ${value}`);
	}
}
