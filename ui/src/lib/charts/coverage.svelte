<script module lang="ts">
	import { Coverage, isUndefined, type DataRow, CustomDate } from '@murithigeo/covjson-core';
	import {
		LineChart,
		LinearGradient,
		Highlight,
		type LineChartProps,
		Spline,
		BarChart,
		type BarChartProps,
		type ChartProps,
		type AnyScale,
		type ChartState,
		Points,
		Legend,
		AreaChart,
		ScatterChart,
		defaultChartPadding,
		Bars
	} from 'layerchart';

	import { scaleThreshold } from 'd3-scale';
	import EmptyChart from '$lib/empty/chart.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
</script>

<script lang="ts">
	import { getCoverageCtx } from '$lib/coverage/coverage-ctx.svelte.js';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { SvelteMap } from 'svelte/reactivity';

	interface Props {
		coverage: Coverage;
	}
	let { coverage = $bindable() }: Props = $props();
	const ctx = getDashCtx();
	const cCtx = getCoverageCtx();

	for (const [key, range] of coverage.ranges) {
		if (!ctx.parameters.has(key) && coverage.parameters.has(key)) {
			ctx.setParameter(key, coverage.parameters.get(key)!);
		}
		if (range.type === 'NdArray') {
			ctx.updateRangeData(key, coverage.uuid, range);
		}
		range.options = {
			...range.options,
			onNonCacheFetch(value) {
				range.options.onNonCacheFetch?.(value);
				ctx.updateRangeData(key, coverage.uuid, range);
			}
		};
		coverage.ranges.set(key, range);
	}

	let parameters = $derived.by<[string, ReactiveParameter][]>(() => {
		return ctx.parameters
			.entries()
			.filter(([key]) => coverage.ranges.has(key))
			.filter(([key]) => ctx.selected.has(key))
			.toArray();
	});
	/**
	 * Should be remapped as t if composite is xAxis
	 */
	let x = $derived(cCtx.xAxis);
	let chartType = $state<'bar' | 'line' | 'area' | 'scatter'>('bar');
	let data = $derived.by(() => {
		const rangeIds = parameters.map(([key]) => key);
		return coverage.query(cCtx.indices, rangeIds, [x]);
	});

	let commonChartProps: ChartProps<DataRow> = $derived({
		brush: { axis: 'both' },
		transform: { mode: 'domain', axis: 'both' },
		rule: true,
		padding: defaultChartPadding()
	});

	let context = $state<ChartState>();
	let tooltipData = $derived<null | DataRow>(context?.tooltip.data);

	// What if we dont have the gradient but style the points

	let offsetMultiplier = $derived.by(() => {
		return (v: number) =>
			!context
				? v
				: context.yScale(v) / (context.height + context.padding.top + context.padding.bottom);
	});

	type ColorStop = [number, string];

	let scales = $derived(new SvelteMap(parameters.map(([key, param]) => [key, param.cScale])));

	let offsetedGradients = $derived.by(() => {
		const values = scales
			.entries()
			.map(([key, stops]): [string, ColorStop[]] => [
				key,
				stops.map(([int, color]): ColorStop => [offsetMultiplier(int) || 0, color])
			]);
		return new SvelteMap(values);
	});
	/**
	 * Get the max value of the current data with some wiggle room
	 */
	const getMax = (data: DataRow[]): number => {
		const values = parameters
			.flatMap(([key]) => data.map((row) => row[key]))
			.filter((value) => typeof value === 'number');
		return Math.max(...values) * 1.2;
	};
</script>

<div class="grid-cols-1 items-center">
	{#await data}
		<EmptyChart status="loading" />
	{:then data}
		{#if !data.length}
			<EmptyChart status="loaded" />
		{:else}
			<Chart.Container config={ctx.chartConfig} class="cursor-default">
				{#if chartType === 'bar'}
					<BarChart
						bind:context
						{...commonChartProps}
						// Incorrect rendering (Unexpected value NaN parsing x attribute.)
						transform={undefined}
						{x}
						{data}
						props={{ bars: { rounded: 'none' } }}
						series={parameters.map(([key, param]) => ({
							param,
							key,
							label: param.simpleLabel,
							color: param.color
						}))}
						seriesLayout="group"
						yDomain={[null, getMax(data)]}
					>
						{#snippet tooltip()}{@render CustomTooltip()}{/snippet}
						{#snippet marks({ context })}
							{#each context.series.series as serie, i (i)}
								<LinearGradient
									stops={offsetedGradients.get(serie.key)!}
									vertical
									units="userSpaceOnUse"
								>
									{#snippet children({ gradient, id })}
										<Bars fill={gradient} y={serie.key} {id} />
									{/snippet}
								</LinearGradient>
							{/each}
						{/snippet}
					</BarChart>
				{:else if chartType === 'line'}
					<LineChart {...commonChartProps} bind:context>
						{#snippet tooltip()}{@render CustomTooltip()}{/snippet}
					</LineChart>
				{:else if chartType === 'scatter'}
					<ScatterChart {...commonChartProps} {data}>
						{#snippet tooltip()}{@render CustomTooltip()}{/snippet}
					</ScatterChart>
				{/if}
			</Chart.Container>
			{#each scales as [key, scale]}
				<Legend
					scale={scaleThreshold(
						scale.map(([int]) => offsetMultiplier(int)),
						scale.map(([, color]) => color)
					)}
					title={key}
					value={tooltipData?.[key]}
				/>
			{/each}
		{/if}
	{/await}
</div>

{#snippet CustomTooltip()}
	<Chart.Tooltip
		labelFormatter={(value: any) => (value instanceof CustomDate ? value.value : value)}
	/>
{/snippet}
