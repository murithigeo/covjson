import { getRandomColor } from '$lib/utils.js';
import {
	Parameter,
	Category,
	ObservedProperty,
	Unit,
	NdArray,
	minMax,
	isNull
} from '@murithigeo/covjson-core';
import { SvelteMap } from 'svelte/reactivity';

type ColorStop = [number, string];
export class ReactiveParameter extends Parameter implements Statistics {
	isCategorical = !!this.categoryEncoding;
	/**
	 * Doubles as the initial color for categories
	 */
	color = $state(getRandomColor());
	ranges = $state(new SvelteMap<string, NdArray>());
	categories = $state(new SvelteMap<string, CategoryState>());

	dataType = $state<'string' | 'float' | 'integer'>('integer');
	median = $state<number | null | string>(null);
	max = $state<number | null>(null);
	min = $state<number | null>(null);
	mean = $state<number | null>(null);
	constructor(param: Parameter) {
		super(param.toPlain(), param.key);
		this.observedProperty.categories?.forEach((cat) => {
			this.setCategory(cat, param.categoryEncoding!.get(cat.id)!);
		});
	}

	get simpleLabel() {
		return this.label.query()?.value || this.key;
	}

	setColor(color: string | null, categoryId?: string): this {
		if (!color) return this;
		// Set all categories with initial color to the updated value;

		if (!categoryId) {
			this.categories
				.entries()
				.filter(([, { color }]) => color === this.color)
				.forEach(([categoryId]) => this.setColor(color, categoryId));
			this.color = color;
			return this;
		}
		const catState = this.categories.get(categoryId);
		if (!catState) return this;
		catState.color = color;
		this.categories = this.categories.set(catState.id, catState);
		return this;
	}
	override getCategory(int: number): CategoryState | undefined {
		for (const [, cat] of this.categories) {
			if (cat.values.includes(int)) return cat;
		}
		return undefined;
	}

	updateRangeData(covId: string, data: NdArray) {
		this.ranges.set(covId, data);
		const ranges = this.ranges.values().toArray();
		if (ranges.length && ranges[0].dataType !== this.dataType) this.dataType = this.dataType;
		this.computeMinMax(ranges);
		this.computeCategoryBins(ranges);
		this.computeMedian(ranges);
		this.computeMean(ranges);
		return this;
	}

	/**
	 * Computes [max|min]imum possible value for the parameter
	 * Will not recalculate if parameter is categorical
	 */
	computeMinMax(ranges: NdArray[]): void {
		if (this.dataType === 'string') return;

		if (this.categoryEncoding) {
			if (!isNull(this.min)) return;
			[this.min, this.max] = minMax(this.categoryEncoding.values().toArray().flat());

			return;
		}
		[this.min, this.max] = minMax(ranges.flatMap((range) => range.ndarr.data as number[]));
	}

	/**
	 * Calculates the mode of each category in ranges loaded
	 */
	computeCategoryBins(ranges: NdArray[]): void {
		if (!this.categories.size) return;
		const flatData = ranges.map((range) => range.ndarr.data).flat();

		for (const [id, category] of this.categories) {
			category.size = flatData.filter((v) => category.values.includes(v as number)).length;
			this.categories.set(id, category);
		}
	}
	/**
	 *
	 */
	computeMean(ranges: NdArray[]): void {
		if (this.dataType === 'string') return;
		const total = ranges
			.map((range) => range.ndarr.data as (number | null)[])
			.flat()
			.filter((v) => typeof v === 'number')
			.reduce((l, r) => l + r, 0);
		const totalSize = ranges.reduce((l, r) => l + r.totalSize, 0);
		this.mean = total / totalSize;
	}

	setCategory(category: Category, values: number[]) {
		this.categories.set(category.id, new CategoryState(category, this.color, values));
	}

	computeMedian(ranges: readonly NdArray[]): void {
		this.median = calculateMedian(ranges.flatMap((range) => range.ndarr.data));
	}
}

export class CategoryState extends Category {
	color = $state<string>();
	values: number[];
	/**
	 * Number of values in this category.
	 * Used to construct histogram
	 */
	size = $state(0);
	constructor(cat: Category, initialColor: string, values: number | number[]) {
		super(cat.toPlain());
		this.color = initialColor;
		this.values = Array.isArray(values) ? values : [values];
	}

	setColor(color: string) {
		this.color = color;
	}
	setSize(count: number) {
		this.size = count;
	}
}

export type Statistics = Record<'mean' | 'min' | 'max', number | null> & {
	median: number | string | null;
};
export function calculateMedian(data: (number | string | null)[]): string | number | null {
	if (data.length < 1) return null;

	let isNumber = typeof data[0] === 'number';

	if (!data.length) return null;

	const compareFn = !isNumber
		? (a: any, b: any) => String(a).localeCompare(b)
		: (a: any, b: any) => Number(a) - Number(b);

	data.sort(compareFn);
	let index: number[] | number = Math.floor(data.length / 2);

	if (data.length % 2 === 0) {
		index = [index, index - 1];
	}
	if (!isNumber) {
		if (Array.isArray(index)) return null;
		return data[index];
	}
	if (typeof index === 'number') return data[index];
	const total = index
		.map((i) => data[i])
		.filter((v) => typeof v === 'number')
		.reduce((l, r) => l + r, 0);
	return total / 2;
}
