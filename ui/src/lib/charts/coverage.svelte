<script module lang="ts">
	import {
		Coverage,
		CustomDate,
		isNull,
		isUndefined,
		type DataRow
	} from '@murithigeo/covjson-core';
	import {
		LineChart,
		LinearGradient,
		Spline,
		ChartGroup,
		defaultChartPadding,
		Points,
		type LineChartProps
	} from 'layerchart';

	import { scaleOrdinal } from 'd3-scale';
	import EmptyChart from '$lib/empty/chart.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
</script>

<script lang="ts">
	import { getCoverageCtx } from '$lib/coverage/coverage-ctx.svelte.js';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';

	interface Props {
		coverage: Coverage;
		ref: HTMLElement | null;
	}
	let { coverage = $bindable(), ref = $bindable(null) }: Props = $props();
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

	type ColorStop = [number, string];
	let parameters = $derived.by<[string, ReactiveParameter][]>(() => {
		return ctx.parameters
			.entries()
			.filter(([key]) => coverage.ranges.has(key))
			.filter(([key]) => ctx.selected.has(key))
			.toArray();
	});
	let config = $derived(ctx.chartConfig);
	let x = $derived(cCtx.x);
	let y1 = $derived(cCtx.y1);
	let series = $derived(Object.values(config).map(({ color, ...props }) => props));
	/**
	 * Should be remapped as t if composite is xAxis
	 */

	let data = $derived.by(async () => {
		const preloadAxes = [x, y1].filter((d) => !isUndefined(d));
		const rawRows = await coverage.query(cCtx.indices, [...ctx.selected], preloadAxes);
		const data: Record<string, LineChartProps<DataRow>> = {};
		for (const [key, parameter] of parameters) {
			data[key] = {};
			data[key].data = rawRows.map((row) => {
				let d = { ...row };
				if (!(y1 in d)) d[y1] = '0';
				const value = row[key];
				return {
					[x]: row[x],
					[row[y1].toString()]: value,

					category: parameter.getCategory(value as number)?.id || 'NULL'
				};
			});
			data[key].series = coverage[y1].map((v) => ({ key: v.toString(), label: v.toString() }));
		}
		console.log(data);
		return data;
	});
</script>

<div class="grid-cols-1 items-center">
	{#await data}
		<EmptyChart status="loading" />
	{:then data}
		{#if !Object.keys(data).length}
			<EmptyChart status="loaded" />
		{:else}
			<ChartGroup>
				<div class="flex flex-col">
					{#each parameters as [key, parameter]}
						<Chart.Container {config}>
							{@const catic = parameter.isCategorical}
							<LineChart
								id={key}
								x={['Section', 'Trajectory'].includes(coverage.domainType!) ? 't' : x}
								{...data}
								c="category"
								brush
								cScale={catic ? scaleOrdinal() : undefined}
								cDomain={catic
									? [...parameter.categories.entries().map(([id]) => id), 'NULL']
									: undefined}
								highlight={{ lines: true, points: true }}
								// props={{ tooltip: { root: { facetAll: true } } }}
								// facet={{ padding: 0.05, axis: false, tooltip: (d) => d[y1] }}
								// fx={y1}
								// tooltipContext={{ mode: 'bisect-x' }}
								cRange={catic
									? [
											...parameter.categories
												.entries()
												.map(([, { color = parameter.color }]) => color),
											parameter.color
										]
									: undefined}
								transform={{ mode: 'domain', axis: 'both' }}
								padding={defaultChartPadding({ top: 40 })}
								legend={{ placement: 'top-right', variant: 'swatches' }}
								yDomain={[parameter.min, isNull(parameter.max) ? null : parameter.max * 1.2]}
							>
								{#snippet tooltip({ context })}
									{@const data = context.tooltip.data?.[`${key}:category`]}
									{@render CustomTooltip({
										color: data ? parameter.getCategory(data)?.color : parameter.color
									})}
								{/snippet}
								{#snippet marks({ context: { height, padding, yScale } })}
									<!-- Do the multiple y lines manually and set data manually -->
									{#if catic}
										{@const getOffset = (v: number) =>
											yScale(v) / (height + padding.top + padding.bottom)}
										<LinearGradient
											stops={parameter.categories
												.entries()
												.toArray()
												.flatMap(([, { color = parameter.color, values }]): ColorStop[] =>
													values.map((int) => [int, color])
												)
												.sort(([a], [b]) => b - a)
												.map(([int, color]): ColorStop => [getOffset(int), color])}
											vertical
											units="userSpaceOnUse"
										>
											{#snippet children({ gradient })}
												<Spline stroke={gradient} />
												<Points fill={gradient} r={3} />
											{/snippet}
										</LinearGradient>
									{:else}
										<Spline stroke={parameter.color} />
										<Points fill={parameter.color} r={3} />
									{/if}
								{/snippet}
							</LineChart>
						</Chart.Container>
					{/each}
				</div>
			</ChartGroup>
		{/if}
	{/await}
</div>

{#snippet CustomTooltip({ color }: { color?: string })}
	<Chart.Tooltip {color} labelFormatter={(d) => (d instanceof CustomDate ? d.value : d)} />
{/snippet}

<!-- 
{
  "data": [
    {
      "500": 258.7,
      "t": "2026-08-19T00:00:00Z",
      "category": "NULL"
    },
    {
      "1000": 268.2,
      "t": "2026-08-19T00:00:00Z",
      "category": "NULL"
    },
    {
      "500": 279.4,
      "t": "2026-08-19T06:00:00Z",
      "category": "NULL"
    },
    {
      "1000": 293.5,
      "t": "2026-08-19T06:00:00Z",
      "category": "NULL"
    }
  ],
  "series": [
    {
      "key": "500",
      "label": "500"
    },
    {
      "key": "1000",
      "label": "1000"
    }
  ]
} -->
