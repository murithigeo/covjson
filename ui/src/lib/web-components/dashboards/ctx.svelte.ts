import {
	type Coverage,
	type NdArray,
	type Parameter,
	type OnIndicesChange,
	isUndefined,
	minMax
} from '@murithigeo/covjson-core';
import { getContext, onDestroy, setContext } from 'svelte';
import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import type { ChartConfig } from '$lib/components/ui/chart/index.js';
import type { MetadataRenderDetail } from '../types.d.ts';
/**
 * @see https://www.geeksforgeeks.org/javascript/find-mode-of-an-array-using-javascript/
 */
function mode<T extends number | string | null>(values: T[]): T[] {
	let modes: T[] = [];
	let maxCount = 0;
	let currentCount = 1;

	let i = 0;
	while (i < values.length) {
		// Count the occurrences of the current element
		while (i < values.length - 1 && values[i] === values[i + 1]) {
			currentCount++;
			i++;
		}

		// Update the modes array if needed
		if (currentCount === maxCount) {
			modes.push(values[i]);
		} else if (currentCount > maxCount) {
			maxCount = currentCount;
			modes = [values[i]];
		}

		// Reset currentCount for the next element
		currentCount = 1;
		i++;
	}

	return modes;
}

interface RangeSummary extends Partial<Record<'max' | 'min' | 'avg', number | null>> {
	mode?: (string | number | null)[];
	dataType?: 'string' | 'float' | 'integer';
	median?: string | number | null;
	color: string;
	label: string;
	key: string;
}

export class DashboardContext {
	onIndicesChange = $state<OnIndicesChange>();
	detail = $state<MetadataRenderDetail>('full');
	pinned = $state(new SvelteMap<string, Coverage>());
	input = $state<Coverage[] | undefined>([]);
	coverages = $derived.by(() => {
		const set = new SvelteMap<string, Coverage>([...this.pinned]);
		this.input?.forEach((cov) => set.set(cov.uuid, cov));
		return set;
	});
	parameters = $derived(
		new SvelteMap<string, Parameter>(this.coverages.values().flatMap((v) => [...v.parameters]))
	);
	parameterGroups = $derived(
		new SvelteSet(this.coverages.values().flatMap((cov) => cov.parameterGroups))
	);
	selected = $derived(new SvelteSet(this.parameters.keys()));
	now = $state<string>();
	tvalues = $state(new SvelteSet<string>());
	rangeData = $state(new SvelteMap<string, Map<string, NdArray>>());
	rangeInfo = $state(new SvelteMap<string, RangeSummary>());

	constructor() {
		$effect(() => {
			this.coverages.values().forEach((cov) => cov.t.forEach((t) => this.tvalues.add(t)));
		});

		// calculates range statistics
		$effect(() => {
			for (const [key, covRanges] of this.rangeData) {
				let stats = this.rangeInfo.get(key);
				stats = stats || {
					color: this.getRandomColor(),
					label: this.parameters.get(key)?.label.query()?.value || key,
					key
				};
				const ranges = covRanges.values().toArray();
				[{ dataType: stats.dataType }] = ranges;
				let data = ranges.flatMap((range) => range.ndarr.data);
				const totalSize = ranges.reduce((l, r) => l + r.totalSize, 0);
				let medianIndex: [number, number] | number = (totalSize - 1) / 2;
				if (medianIndex % 1 !== 0) {
					medianIndex = Math.trunc(medianIndex);
					medianIndex = [medianIndex, medianIndex + 1];
				}
				if (stats.dataType === 'string') {
					data = data
						.map((v) => v as string | null)
						.sort((a, b) => String(a).localeCompare(String(b)));
					stats['median'] = Array.isArray(medianIndex) ? null : data[medianIndex];
				} else {
					const values = data
						.map((v) => v as number | null)
						.sort((a, b) => Number(a) - Number(b)) as (number | null)[];
					[stats.min, stats.max] = minMax(values);
					let median: number | null;
					if (Array.isArray(medianIndex)) {
						median =
							medianIndex
								.map((i) => values[i])
								.filter((v) => typeof v === 'number')
								.reduce((l, r) => l + r, 0) / 2;
					} else median = values[medianIndex];
					stats['median'] = median;
					stats['avg'] = values.filter((v) => v !== null).reduce((l, r) => l + r, 0) / totalSize;
				}
				this.rangeInfo.set(key, stats);
			}
		});
		onDestroy(() => {
			this.onIndicesChange = undefined;
			this.input = [];
			this.pinned.clear();
			this.coverages.clear();
			this.parameters.clear();
			this.selected.clear();
			this.parameterGroups.clear();
			this.tvalues.clear();
			this.rangeData.clear();
		});
	}
	updateParameterSelectionStatus(id: string): void {
		if (this.selected.has(id) && this.selected.size > 1) {
			this.selected.delete(id);
		} else this.selected.add(id);
	}
	trashCoverage(uuid: string) {
		this.coverages.delete(uuid);
		this.input = this.input?.filter(({ uuid: id }) => id !== uuid);
	}
	updateCoveragePinStatus(uuid: string): void {
		if (this.pinned.has(uuid)) this.pinned.delete(uuid);
		else if (this.coverages.has(uuid)) this.pinned.set(uuid, this.coverages.get(uuid)!);
	}
	chartConfig = $derived<ChartConfig>(Object.fromEntries(this.rangeInfo));

	updateRangeData(paramId: string, covUuid: string, range: NdArray) {
		let data = this.rangeData.get(paramId);
		data = data || new Map();
		data.set(covUuid, range);
		this.rangeData.set(paramId, data);
	}
	// Source - https://stackoverflow.com/a/1484514
	// Posted by Anatoliy, modified by community. See post 'Timeline' for change history
	// Retrieved 2026-08-20, License - CC BY-SA 3.0

	getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
	setNow(t?: string) {
		this.now = t;
	}
	// Local data summary for selected coverage
}

const DashboardKey = Symbol('DASH');

export function setDashCtx() {
	return setContext(DashboardKey, new DashboardContext());
}
export function getDashCtx() {
	return getContext<ReturnType<typeof setDashCtx>>(DashboardKey);
}
