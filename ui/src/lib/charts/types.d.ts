interface DataRow<T extends string | number = string | number> {
	[rangeName: string]: T | null | undefined;
	z?: number;
	t?: string;
}
