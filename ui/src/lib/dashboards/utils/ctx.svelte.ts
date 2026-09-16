import {
	Coverage,
	CustomDate,
	NdArray,
	Parameter,
	ParameterGroup,
	type OnIndicesChange
} from '@murithigeo/covjson-core';
import { getContext, onDestroy, setContext } from 'svelte';
import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import type { SliderValue, StringSliderValue } from '$lib/sliders/sliders.js';
import { calculateStats, ReactiveParameter } from './parameter.svelte.js';

// todo automatically call onIndicesChange on the active Coverage
class DashboardContext {
	onIndicesChange = $state<OnIndicesChange>();
	detail = $state<'simple' | 'full'>('full');
	pinned = $state(new SvelteMap<string, Coverage>());
	input = $state<Coverage[]>([]);
	coverages = $derived(
		new SvelteMap([...this.pinned, ...this.input.map((cov) => [cov.uuid, cov] as const)])
	);
	parameters = $state(new SvelteMap<string, ReactiveParameter>());
	parameterGroups = $state(new SvelteSet<ParameterGroup>());

	selected = $derived(new SvelteSet(this.parameters.keys()));
	now = $state<SliderValue<string>>();
	tvalues = $state(new SvelteSet<CustomDate>());
	currentCoverage = $state<Coverage | undefined>();
	currentCoverageSummary = $derived.by(() => {
		if (!this.currentCoverage) return undefined;
		const coverage = this.currentCoverage;
		const stats = this.parameters
			.entries()
			.filter(([, param]) => param.values.has(coverage.uuid))
			.map(([key, param]) => [key, calculateStats([param.values.get(coverage.uuid)!])] as const);

		return new Map(stats);
	});
	constructor() {
		$effect(() => {
			this.coverages.values().forEach((cov) => cov.t.forEach((t) => this.tvalues.add(t)));
		});
		$effect(() => {
			this.input
				.flatMap(({ parameters }) => [...parameters])
				.forEach(([key, param]) => this.setParameter(key, param));
		});
		onDestroy(() => {
			this.onIndicesChange = undefined;
			this.input = [];
			this.pinned.clear();
			this.selected.clear();
			this.tvalues.clear();
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
	updateCoveragePinStatus(coverage: Coverage) {
		return (checked: boolean) => {
			if (checked) this.pinned.set(coverage.uuid, coverage);
			else this.pinned.delete(coverage.uuid);
		};
	}

	updateRangeData(paramId: string, covUuid: string, range: NdArray) {
		let param = this.parameters.get(paramId);
		if (!param) return;

		param = param.updateRangeData(covUuid, range);
		this.parameters = this.parameters.set(paramId, param);
	}

	setNow(bounds: StringSliderValue): void {
		if (!this.now) this.now = bounds;
		else
			for (let i = 0; i < 3; i++) {
				if (bounds[i] !== this.now[i]) this.now[i] = bounds[i];
			}
	}
	setCurrentCoverage(coverage: Coverage) {
		return (checked: boolean) => {
			if (checked) this.currentCoverage = coverage;
			else this.currentCoverage = undefined;
		};
	}

	setParameterColor(paramId: string, color: string | null, categoryId?: string) {
		let param = this.parameters.get(paramId);
		if (!param) return;
		param = param?.setColor(color, categoryId);

		this.parameters = this.parameters.set(paramId, param);
	}
	chartConfig = $derived.by<ChartConfig>(() => {
		const entries = this.parameters
			.entries()
			.map(([key, param]) => [key, { key, color: param.color, label: param.simpleLabel }]);
		return Object.fromEntries(entries);
	});
	setParameter(key: string, parameter: Parameter) {
		if (this.parameters.has(key)) return;
		this.parameters.set(key, new ReactiveParameter(parameter));
	}
}
type ChartConfig = Record<string, Record<'label' | 'key' | 'color', string>>;

const DashboardKey = Symbol('DASH');

export function setDashCtx() {
	return setContext(DashboardKey, new DashboardContext());
}
export function getDashCtx() {
	return getContext<ReturnType<typeof setDashCtx>>(DashboardKey);
}
