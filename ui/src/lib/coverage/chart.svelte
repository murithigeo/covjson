<script module lang="ts">
	import { Coverage, isUndefined, type DataRow, indexOfNearest } from '@murithigeo/covjson-core';
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
		Legend
	} from 'layerchart';
	import { scaleUtc, scaleOrdinal } from 'd3-scale';
	import EmptyChart from '$lib/empty/chart.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
</script>

<script lang="ts">
	import { getCoverageCtx } from './coverage-ctx.svelte.ts';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { onMount } from 'svelte';

	interface Props {
		coverage: Coverage;
	}
	let { coverage = $bindable() }: Props = $props();
	const ctx = getDashCtx();
	const cCtx = getCoverageCtx();

	const tAsEpoch = coverage.t.map((v) => new Date(v).getTime());

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
	let xAxis = $derived(cCtx.xAxis);

	type AugmentedDataRow = Omit<DataRow, 't'> & { t?: Date };

	let rows = $state<DataRow[]>([]);
	const updateRows = (data: DataRow[]) => (rows = data);

	let dataPromise = $derived(
		coverage.query(xAxis)(cCtx.indices, ctx.selected.keys().toArray()).then(updateRows)
	);
	$effect(() => {
		dataPromise;
	});
	let commonChartProps: ChartProps<AugmentedDataRow> = {
		brush: { axis: 'both' },
		transform: { mode: 'domain', axis: 'both' },
		legend: true,
		yNice: true
	};
	let barChartProps = $derived.by(() => {
		if (rows.length !== 1) return undefined;
		const props: BarChartProps<AugmentedDataRow> = { ...commonChartProps };
		props.series = ctx.parameters
			.entries()
			.filter(([key]) => coverage.ranges.has(key))
			.filter(([key]) => ctx.selected.has(key))
			.map(([key, param]) => {
				const data = rows[0][key];
				let color: string | undefined = param.color;
				if (param.categories.size > 0) {
					color = param.getCategoryId(data as number)?.color;
					if (!color) color = param.color;
				}

				return {
					key,
					label: param.simpleLabel,
					color,
					data: [{ key: key, value: data }]
				};
			})
			.toArray();
		props.x = 'key';
		props.y = 'value';
		props.axis = 'x';
		props.rule = true;
		props.labels = { offset: 12 };
		props.props = {};
		props.props.bars = {
			stroke: 'none',
			radius: 8,
			rounded: 'all',
			motion: { type: 'tween', duration: 500 }
		};
		return props;
	});
	let lineChartProps = $derived.by(() => {
		if (rows.length < 2) return undefined;
		const props: LineChartProps<AugmentedDataRow> = { ...commonChartProps };
		props.props = {};
		props.x = xAxis;
		//@ts-expect-error modifying t results in incompatible data-tyoe
		props.data = rows.map((v) => ({ ...v, t: isUndefined(v.t) ? undefined : new Date(v.t) }));
		props.series = ctx.parameters
			.entries()
			.filter(([key]) => ctx.selected.has(key))
			.filter(([key]) => coverage.ranges.has(key))
			.map(([key, info]) => [key, info] as const)
			.toArray()
			.map(([key, { color, simpleLabel: label }]) => {
				return {
					key,
					label,
					color
				};
			});

		if (xAxis === 'composite' || xAxis === 't') {
			props.xScale = scaleUtc();
		}
		props.props.xAxis = {
			label: xAxis === 't' ? 'Date[Time]' : xAxis === 'z' ? 'Elevation' : 'Node'
		};
		return props;
	});

	// What if we dont have the gradient but style the points
	function generateLinearGradientStops(
		{ yScale, padding, height }: ChartState<any, AnyScale, AnyScale>,
		param: ReactiveParameter
	): [number, string][] {
		const { top, bottom } = padding;
		const getOffset = (v: number) => yScale(v) / (height + top + bottom);
		return param.colorScale.map((scale) => [getOffset(scale[0]), scale[1]]);
	}
</script>

{#if !lineChartProps && !barChartProps}
	<EmptyChart status="loaded" />
{:else}
	<Chart.Container config={ctx.chartConfig}>
		{#if rows.length === 1}
			<BarChart {...barChartProps!}>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel />
				{/snippet}
			</BarChart>
		{:else}
			<LineChart {...lineChartProps!}>
				{#snippet tooltip()}
					<Chart.Tooltip
						labelFormatter={(e) => {
							if (e instanceof Date) {
								const idx = indexOfNearest(tAsEpoch, e.getTime());
								return coverage.t[idx];
							}
							return e;
						}}
					></Chart.Tooltip>
				{/snippet}
				{#snippet marks({ context })}
					{#each context.series.series as serie, i (i)}
						{@const param = ctx.parameters.get(serie.key)!};
						{#if !param?.categories.size}
							<Spline y={serie.key} stroke={serie.color} />
						{:else}
							<LinearGradient
								vertical
								stops={generateLinearGradientStops(context, param)}
								units="userSpaceOnUse"
							>
								<!-- Make the label show the category/color when hovered/clicked -->
								{#snippet children({ gradient })}
									<Spline y={serie.key} stroke={gradient} />
									<Points y={serie.key} fill={gradient} />
								{/snippet}
							</LinearGradient>
						{/if}
						<Highlight points lines />
					{/each}
				{/snippet}
			</LineChart>
		{/if}
	</Chart.Container>
	{@const cScale = ctx.parameters
		.get('TEMPERATURE')!
		.colorScale.sort(([numA], [numB]) => numA - numB)}
	<Legend
		scale={scaleOrdinal(
			cScale.map(([num]) => num),
			cScale.map(([, color]) => color)
		)}
		variant="ramp"
	/>
{/if}
