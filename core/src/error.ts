export class Exception extends Error {
	constructor(status: number, url: string, description?: string) {
		let message = `Failed to fetch resource at: ${url} with status:${status}`;
		if (description) message += ` with message:${description}`;
		super(message);
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
