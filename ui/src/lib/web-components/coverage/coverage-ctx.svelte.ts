import { Coverage, NdArray } from '@murithigeo/covjson-core';
import { getContext, onDestroy, setContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { getDashCtx } from '../dashboards/ctx.svelte.ts';
export class CoverageCtx {
	dashCtx = getDashCtx();
	coverage = $state<Coverage>(); // Coverage;
	indices = $derived(new SvelteMap(this.coverage?.indices));
	limits = $derived.by(() => {
		const limits = new SvelteMap<'horizontal' | 'vertical', { value: number; axis: string }>();
		if (!this.coverage) return limits;
		switch (this.coverage.domain.domainType) {
			case 'Grid':
				limits
					.set('horizontal', {
						axis: 'x',
						value: this.coverage.axesSize.get('x') || 0
					})
					.set('vertical', {
						axis: 'y',
						value: this.coverage.axesSize.get('y') || 0
					});
				break;
			case 'Polygon':
			case 'PolygonSeries':
			case 'MultiPoint':
			case 'MultiPointSeries':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
				limits.set('horizontal', {
					axis: 'composite',
					value: this.coverage.axesSize.get('composite') || 0
				});
				break;
		}
		return limits;
	});
	constructor(coverage: Coverage) {
		this.coverage = coverage;
		$effect(() => this.dashCtx.onIndicesChange?.(this.coverage, new Map(this.indices)));
		onDestroy(() => {
			this.coverage = undefined;
			this.indices.clear();
			this.limits.clear();
		});
	}
	crementIdx(operator: '+' | '-', direction: 'vertical' | 'horizontal') {
		const stats = this.limits.get(direction);
		if (!stats) return;
		let { axis, value: max } = stats;
		let currentIndex = this.indices.get(axis)!;
		if (operator === '+') currentIndex += 1;
		else currentIndex -= 1;
		currentIndex = (currentIndex + max) % max;
		this.indices.set(axis, currentIndex);
	}
	updateTemporalIndex(index: number) {
		switch (this.coverage?.domainType) {
			case 'Trajectory':
			case 'Section':
				this.indices.set('composite', index);
				break;
			default:
				this.indices.set('t', index);
		}
	}
}

const CtxKey = Symbol('CovKey');
export function setCoverageCtx(coverage: Coverage) {
	return setContext(CtxKey, new CoverageCtx(coverage));
}

export function getCoverageCtx() {
	return getContext<ReturnType<typeof setCoverageCtx>>(CtxKey);
}
