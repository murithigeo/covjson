<script lang="ts">
	import type { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { Coverage, Parameter, type DataRow } from '@murithigeo/covjson-core';
	import { type ChartConfig, Container as ChartContainer } from '$lib/components/ui/chart/index.js';
	import Line from './line-chart.svelte';
	import Bar from './bar-chart.svelte';
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

	let config = $derived.by(() => {
		const config: ChartConfig = {};
		coverage?.parameters?.entries().forEach(([key, value], i) => {
			config[key] = {
				label: value.label.query()?.value || key,
				color: `var(--chart-${i + 1})`
			};
		});
		return config;
	});

	/**
	 *
	 */
	let dataPromise = $derived.by(async () => {
		let preloadAxis = ['z', 't'];

		const data = await coverage?.query(...preloadAxis)(indices, selected?.keys().toArray());
		return data || [];
	});
	let series = $derived(
		Object.entries(config).map(([key, config]) => ({
			...config,
			selected: selected?.has(key) || true,
			key
		}))
	);
</script>

<!-- todo Legend for categorical values and color customization (gradient th)-->
<ChartContainer {config}>
	{#await dataPromise}
		<Skeleton />
	{:then data}
		{#if type === 'line'}
			{console.log(data)}
			<Line {data} {series} x="t" props={{ xAxis: { label: 'Datetime' } }} />
		{:else if type === 'bar'}
			<Bar {data} {series} />
		{/if}
	{/await}
</ChartContainer>
