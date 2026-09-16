import { getRandomColor } from '$lib/utils.js';
import {
	Parameter,
	Category,
	ObservedProperty,
	Unit,
	NdArray,
	minMax
} from '@murithigeo/covjson-core';
import { SvelteMap } from 'svelte/reactivity';

type Statistics = Record<'min' | 'max' | 'mean', number | null> & {
	median: string | number | null;
	dataType: 'string' | 'float' | 'integer';
};

export class ReactiveParameter extends Parameter {
	/**
	 * Doubles as the initial color for categories
	 */
	color = $state(getRandomColor());
	values = $state(new SvelteMap<string, NdArray>());
	stats = $derived(calculateStats([...this.values.values()]));
	categories = $state(new SvelteMap<string, CategoryState>());
	/**
	 * A list of number stops and their colors
	 */
	colorScale = $derived.by<[number, string][]>(() => {
		return this.categories
			.entries()
			.toArray()
			.flatMap(([, { color, values }]) => values.map((int) => [int, color]))
			.sort(([numA], [numB]) => (numB as number) - (numA as number));
	});
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
	getCategoryId(int: number): CategoryState | undefined {
		for (const [, cat] of this.categories) {
			if (cat.values.includes(int)) return cat;
		}
		return undefined;
	}

	updateRangeData(covId: string, data: NdArray) {
		this.values.set(covId, data);
		return this;
	}

	setCategory(category: Category, values: number[]) {
		this.categories.set(category.id, new CategoryState(category, this.color, values));
	}
}

class CategoryState extends Category {
	color = $state<string>();
	values: number[];
	/**
	 * Number of values in this category.
	 * Used to construct histogram
	 */
	size?: number;
	constructor(cat: Category, initialColor: string, values: number | number[]) {
		super(cat.toPlain());
		this.color = initialColor;
		this.values = Array.isArray(values) ? values : [values];
	}

	setColor(color: string) {
		this.color = color;
	}
}

export function calculateStats(data: NdArray[]): Statistics {
	let [min, max, mean] = Array<number | null>(3).fill(null);
	let median: string | number | null = null;
	if (!data.length) return { min, max, mean, median, dataType: 'string' };
	const ranges = data.values().toArray();
	const dataType = ranges[0].dataType;

	const values = ranges.flatMap((v) => v.ndarr.data);
	const totalSize = ranges.reduce((l, r) => l + r.totalSize, 0);

	let medianIndex: number | [number, number] = (totalSize - 1) / 2;
	if (medianIndex % 1 !== 0) {
		medianIndex = Math.trunc(medianIndex);
		medianIndex = [medianIndex, medianIndex + 1];
	}

	if (dataType === 'string') {
		if (!Array.isArray(medianIndex)) {
			median = values.sort((a, b) => String(a).localeCompare(String(b)))[medianIndex];
		}
	} else {
		[min, max] = minMax(values as number[]);
		mean = values.filter((v) => typeof v === 'number').reduce((l, r) => l + r, 0) / totalSize;
		const v = values.map((v) => Number(v)).sort((a, b) => a - b);
		if (Array.isArray(medianIndex)) {
			median = medianIndex
				.map((i) => v[i])
				.filter((v) => !isNaN(v))
				.reduce((l, r) => l + r, 0);
			median /= 2;
		} else median = v[medianIndex];
	}
	return {
		dataType,
		min,
		max,
		median,
		mean
	};
}
