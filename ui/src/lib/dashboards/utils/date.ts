/**
 * Stores multiple date strings resolving to the same epoch
 * @example new MultiDate("2021","2021-01","2021-01-01")
 */
export class MultiDate extends Date {
	items: Set<string>;
	constructor(...values: [string, ...string[]]) {
		super(values[0]);
		this.items = new Set([...values]);
	}
	addItems(...values: string[]): this {
		values.forEach((v) => this.items.add(v));
		return this;
	}
	getMatching(values: string[]): string | undefined {
		return values.find((v) => new Date(v).getTime() === this.getTime());
	}
}
