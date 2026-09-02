import { Coverage, NdArray, Parameter, type OnIndicesChange } from '@murithigeo/covjson-core';
import { getContext, onDestroy, setContext } from 'svelte';
import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import {
	getParameterStatistics,
	type RangeSummary,
	getRangeStats,
	generateRangeConfig,
	type RangeStatistics
} from '$lib/statistics.js';
import type { SliderValue, StringSliderValue } from '$lib/sliders/sliders.js';
import './chart-register.ts';
// todo automatically call onIndicesChange on the active Coverage
class DashboardContext {
	onIndicesChange = $state<OnIndicesChange>();
	detail = $state<'simple' | 'full'>('full');
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
	now = $state<SliderValue<string>>();
	tvalues = $state(new SvelteSet<string>());
	rangeData = $state(new SvelteMap<string, SvelteMap<string, NdArray>>());
	rangeInfo = $state(new SvelteMap<string, RangeSummary>());
	currentCoverage = $state<string | Coverage>();
	currentCoverageSummary = $derived.by(() => {
		if (!this.currentCoverage) return undefined;
		const cov =
			typeof this.currentCoverage === 'string'
				? this.coverages.get(this.currentCoverage)
				: this.currentCoverage;
		if (!cov) return undefined;
		const map = new Map<string, RangeSummary>();
		//
		this.rangeInfo
			.entries()
			.filter(([key]) => cov.ranges.has(key))
			.forEach(([key, info]) => {
				const param = this.parameters.get(key) || key;
				const rangeData = this.rangeData.get(key)?.get(cov.uuid);
				const ranges = new Map();

				if (rangeData) ranges.set(cov.uuid, rangeData);

				const specific = getParameterStatistics(param, ranges, info);
				map.set(key, specific);
			});
		return map;
	});
	constructor() {
		$effect(() => {
			this.coverages.values().forEach((cov) => cov.t.forEach((t) => this.tvalues.add(t)));
		});

		onDestroy(() => {
			this.onIndicesChange = undefined;
			this.input = [];
			this.pinned.clear();
			this.selected.clear();
			this.tvalues.clear();
			this.rangeData.clear();
			this.rangeInfo.clear();
		});
	}
	updateParameterSelectionStatus(id: string) {
		// if (this.selected.has(id) && this.selected.size > 1) {
		return (checked: boolean) => {
			if (checked) this.selected.add(id);
			else this.selected.delete(id);
		};
	}

	trashCoverage(uuid: string) {
		this.coverages.delete(uuid);
		this.input = this.input?.filter(({ uuid: id }) => id !== uuid);
	}
	updateCoveragePinStatus(uuid: string): void {
		this.input = this.input?.filter((cov) => cov.uuid !== uuid);
		this.pinned.delete(uuid);
	}
	updateRangeInfoStatistics(paramId: string) {
		const param = this.parameters.get(paramId) || paramId;
		const rangeData = this.rangeData.get(paramId);
		const info = this.rangeInfo.get(paramId);

		const updated = getParameterStatistics(param, rangeData || new Map(), info);
		this.rangeInfo.set(paramId, updated);
	}
	updateRangeData(paramId: string, covUuid: string, range: NdArray) {
		let data = this.rangeData.get(paramId) || new SvelteMap();
		data.set(covUuid, range);
		this.rangeData.set(paramId, data);
		this.updateRangeInfoStatistics(paramId);
	}

	setNow(bounds: StringSliderValue): void {
		if (!this.now) this.now = bounds;
		else
			for (let i = 0; i < 3; i++) {
				if (bounds[i] !== this.now[i]) this.now[i] = bounds[i];
			}
	}
	setCurrentCoverage(coverage: Coverage | string | undefined) {
		this.currentCoverage = coverage;
	}

	setParameterColor(paramId: string, color: string | null, categoryId?: string) {
		const config = this.rangeInfo.get(paramId);
		if (color === null || !config) return;
		const updated = { ...config };
		if (!categoryId) updated.color.primary = color;
		if (updated.color.categories && categoryId) {
			updated.color.categories.set(categoryId, color);
		}

		this.rangeInfo.set(paramId, updated);
	}
}

const DashboardKey = Symbol('DASH');

export function setDashCtx() {
	return setContext(DashboardKey, new DashboardContext());
}
export function getDashCtx() {
	return getContext<ReturnType<typeof setDashCtx>>(DashboardKey);
}
