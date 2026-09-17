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

export type Statistics = Record<'min' | 'max' | 'mean', number | null> & {
	median: string | number | null;
	dataType: 'string' | 'float' | 'integer';
	frequency?: SvelteMap<string, number>;
};

type ColorStop = [number, string];
export class ReactiveParameter extends Parameter {
	/**
	 * Doubles as the initial color for categories
	 */
	color = $state(getRandomColor());
	values = $state(new SvelteMap<string, NdArray>());
	stats = $derived(calculateStats([...this.values.values()], this.categoryEncoding));
	categories = $state(new SvelteMap<string, CategoryState>());
	/**
	 * A list of number stops and their colors
	 */
	cScale = $derived.by<ColorStop[]>(() => {
		if (!this.categories.size) return [[this.stats.max || 0, this.color]];

		return this.categories
			.entries()
			.toArray()
			.flatMap(([, { color, values }]) =>
				values.map((int): ColorStop => [int, color || this.color])
			)
			.sort(([numA], [numB]) => Number(numB) - Number(numA));
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

export function calculateStats(
	data: NdArray[],
	categoryEncoding?: Map<string, number[]>
): Statistics {
	let stats: Statistics = {
		min: null,
		max: null,
		median: null,
		mean: null,
		frequency: undefined,
		dataType: 'string'
	};

	if (!data.length) return stats;
	const ranges = data.values().toArray();
	[{ dataType: stats.dataType }] = ranges;

	const values = ranges.flatMap((v) => v.ndarr.data);
	const totalSize = ranges.reduce((l, r) => l + r.totalSize, 0);

	let medianIndex: number | [number, number] = (totalSize - 1) / 2;
	if (medianIndex % 1 !== 0) {
		medianIndex = Math.trunc(medianIndex);
		medianIndex = [medianIndex, medianIndex + 1];
	}

	if (stats.dataType === 'string') {
		if (!Array.isArray(medianIndex)) {
			stats.median = values.sort((a, b) => String(a).localeCompare(String(b)))[medianIndex];
		}
	} else {
		[stats.min, stats.max] = minMax(values as number[]);
		stats.mean = values.filter((v) => typeof v === 'number').reduce((l, r) => l + r, 0) / totalSize;
		const v = values.map((v) => Number(v)).sort((a, b) => a - b);
		if (Array.isArray(medianIndex)) {
			stats.median = medianIndex
				.map((i) => v[i])
				.filter((v) => !isNaN(v))
				.reduce((l, r) => l + r, 0);
			stats.median /= 2;
		} else stats.median = v[medianIndex];
		if (categoryEncoding && categoryEncoding.size) {
			stats.frequency = new SvelteMap();
			const groups = Object.groupBy(
				values,
				(item) =>
					categoryEncoding.entries().find(([, values]) => values.includes(item as number))?.[0]!
			);
			groups['NULL'] = values.filter((v) => v === null);
			for (const catId in groups) {
				stats.frequency.set(catId, groups[catId]!.length);
			}
		}
	}
	return stats;
}
