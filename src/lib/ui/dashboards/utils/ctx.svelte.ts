import {
	Coverage,
	Range,
	Parameter,
	ParameterGroup,
	type OnIndicesChange
} from '#lib/core/index.ts';
import { getContext, onDestroy, setContext } from 'svelte';
import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import { ReactiveParameter } from './parameter.svelte.js';
import { MultiDate } from './date.ts';
// todo automatically call onIndicesChange on the active Coverage
class DashboardContext {
	onIndicesChange = $state<OnIndicesChange>();
	pinned = new SvelteMap<string, Coverage>();
	input = new SvelteMap<string, Coverage>();
	coverages = $derived(new SvelteMap([...this.pinned, ...this.input]));
	parameters = $state(new SvelteMap<string, ReactiveParameter>());
	parameterGroups = $state(new SvelteSet<ParameterGroup>());
	selected = $derived(new SvelteSet(this.parameters.keys()));
	tvalues = $state<MultiDate[]>([]);

	constructor() {
		onDestroy(() => {
			this.onIndicesChange = undefined;
			this.input.clear();
			this.pinned.clear();
			this.selected.clear();
			this.tvalues = [];
		});
	}
	updateParameterSelectionStatus(id: string) {
		// if (this.selected.has(id) && this.selected.size > 1) {
		return (checked: boolean) => {
			if (checked) this.selected.add(id);
			else this.selected.delete(id);
		};
	}

	trashCoverage(cov: Coverage) {
		this.input.delete(cov.uuid);
		this.pinned.delete(cov.uuid);
	}
	updateCoveragePinStatus(coverage: Coverage) {
		if (this.pinned.has(coverage.uuid)) this.pinned.delete(coverage.uuid);
		else this.pinned.set(coverage.uuid, coverage);
	}

	updateRangeData(paramId: string, covUuid: string, range: Range) {
		let param = this.parameters.get(paramId);
		if (!param) return;

		param = param.updateRangeData(covUuid, range);
		this.parameters = this.parameters.set(paramId, param);
	}

	setParameterColor(paramId: string, color: string | null, categoryId?: string) {
		let param = this.parameters.get(paramId);
		if (!param) return;
		param = param?.setColor(color, categoryId);

		this.parameters = this.parameters.set(paramId, param);
	}
	chartConfig = $derived.by<Record<string, { color?: string; key: string; label: string }>>(() => {
		const entries = this.parameters
			.entries()
			.map(([key, param]) => [key, { key, color: param.color, label: param.simpleLabel }]);
		return Object.fromEntries(entries);
	});
	setParameter(key: string, parameter: Parameter) {
		if (this.parameters.has(key)) return;
		this.parameters.set(key, new ReactiveParameter(parameter));
	}
	setPGroup(group: ParameterGroup) {
		this.parameterGroups.add(group);
	}
	updateTemporalList(...values: string[]) {
		for (const date of values) {
			const idx = this.tvalues.findIndex((obj) => obj.getTime() === new Date(date).getTime());
			if (idx < 0) {
				this.tvalues.push(new MultiDate(date));
				continue;
			}
			this.tvalues[idx] = this.tvalues[idx].addItems(date);
		}
		this.tvalues.sort((a, b) => a.getTime() - b.getTime());
	}
	setInput(coverages: Coverage[]) {
		coverages.forEach((cov) => {
			this.input.delete(cov.uuid);
			this.input.set(cov.uuid, cov);
			cov.parameters.forEach((param, key) => {
				if (!this.parameters.has(key)) this.setParameter(key, param);
			});
			cov.parameterGroups.forEach((group) => this.setPGroup(group));
			this.updateTemporalList(...cov.t);
		});
	}
	setIndicesCallback(cb?: OnIndicesChange) {
		if (!cb) return;
		this.onIndicesChange = cb;
	}
}

const DashboardKey = Symbol('DASH');

export function setDashCtx() {
	return setContext(DashboardKey, new DashboardContext());
}
export function getDashCtx() {
	return getContext<ReturnType<typeof setDashCtx>>(DashboardKey);
}
