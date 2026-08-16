<script lang="ts">
	import type { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { Coverage, Parameter, type DataRow } from '@murithigeo/covjson-core';
	import { type ChartConfig, Container as ChartContainer } from '$lib/components/ui/chart/index.js';
	import Line from './line-chart.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { SeriesData, SplineProps, BarsProps } from 'layerchart';
	import type { Component } from 'svelte';

	interface Props {
		type: 'line' | 'bar';
		indices: SvelteMap<string, number>;
		coverage?: Coverage;
		selected?: SvelteSet<string>;
	}

	let {
		type = $bindable('line'),
		indices = $bindable(),
		coverage = $bindable(),
		selected = $bindable()
	}: Props = $props();

	let config = $derived(
		coverage?.parameters.entries().reduce(
			(l: ChartConfig, [key, param], i) => ({
				...l,
				[key]: { label: param.label.query()?.value || key, color: `var(--chart-${i + 1})`, key }
			}),
			{}
		) || {}
	);

	/**
	 *
	 */
	let dataPromise = $derived.by(async () => {
		let preloadAxis = ['z', 't'];

		const data = await coverage?.query(...preloadAxis)(indices, selected?.keys().toArray());
		return data || [];
	});
	let series = $derived.by(() => {
		return Object.entries(config).map(([key, config]) => {
			return { ...config, key, selected: selected?.has(key) || true };
		});
	});
</script>

<!-- todo Legend for categorical values and color customization (gradient th)-->
<ChartContainer {config}>
	{#await dataPromise}
		<Skeleton />
	{:then data}
		{#if type === 'line'}
			<Line {data} {series} x="z" props={{ xAxis: { label: 'Elevation' } }} />
		{/if}
	{/await}
</ChartContainer>
