import { Coverage, NdArray, Parameter, type OnIndicesChange } from '@murithigeo/covjson-core';
import { getContext, onDestroy, setContext } from 'svelte';
import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import type { ChartConfig } from '$lib/components/ui/chart/index.js';
import {
	getParameterStatistics,
	type RangeSummary,
	getRangeStats,
	generateRangeConfig,
	type RangeStatistics
} from '$lib/statistics.js';
import type { SliderValue, StringSliderValue } from '$lib/sliders/sliders.js';

export class DashboardContext {
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
	rangeData = $state(new SvelteMap<string, Map<string, NdArray>>());
	rangeInfo = $state(new SvelteMap<string, RangeSummary>());
	highlightCoverage = $derived<string | undefined>(this.coverages.keys().toArray()[0]);
	highlightCovSummary = $derived.by(() => {
		const stats = new SvelteMap<string, RangeStatistics>();
		for (const [key, param] of this.parameters) {
			if (!this.highlightCoverage) continue;
			const data = this.rangeData.get(key)?.get(this.highlightCoverage);
			if (!data) continue;
			const config: RangeSummary = this.rangeInfo.get(key) || generateRangeConfig(param);
			Object.assign(config, getRangeStats([data]));
			stats.set(key, config);
		}
		return stats;
	});
	constructor() {
		$effect(() => {
			this.coverages.values().forEach((cov) => cov.t.forEach((t) => this.tvalues.add(t)));
		});

		// calculates range statistics
		$effect(() => {
			for (const [key, covRanges] of this.rangeData) {
				let stats = getParameterStatistics(
					this.parameters.get(key) || key,
					covRanges,
					this.rangeInfo.get(key)
				);
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

	setNow(bounds: StringSliderValue): void {
		if (!this.now) this.now = bounds;
		else
			for (let i = 0; i < 3; i++) {
				if (bounds[i] !== this.now[i]) this.now[i] = bounds[i];
			}
	}
	setActiveCoverage(coverage: Coverage | string) {
		this.highlightCoverage = typeof coverage === 'string' ? coverage : coverage.uuid;
	}

	setParameterColor(paramId: string, color: string) {
		const config = this.rangeInfo.get(paramId);
		if (!config) return;
		config.color = color;
		this.rangeInfo.set(paramId, config);
	}
}

const DashboardKey = Symbol('DASH');

export function setDashCtx() {
	return setContext(DashboardKey, new DashboardContext());
}
export function getDashCtx() {
	return getContext<ReturnType<typeof setDashCtx>>(DashboardKey);
}
