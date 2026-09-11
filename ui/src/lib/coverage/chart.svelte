<script module lang="ts">
	import {
		Coverage,
		isUndefined,
		minMax,
		type DataRow,
		Parameter,
		indexOfNearest
	} from '@murithigeo/covjson-core';
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
		Points
	} from 'layerchart';
	import { scaleBand, scaleUtc } from 'd3-scale';
	import EmptyChart from '$lib/empty/chart.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
</script>

<script lang="ts">
	import { getCoverageCtx } from './coverage-ctx.svelte.ts';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import type { RangeSummary } from '$lib/statistics.js';

	interface Props {
		coverage: Coverage;
	}
	let { coverage = $bindable() }: Props = $props();
	const [ctx, cCtx] = [getDashCtx(), getCoverageCtx()];

	const tAsEpoch = coverage.t.map((v) => new Date(v).getTime());

	// Add callback to automaticall update range summary
	for (const [key, range] of coverage.ranges) {
		if (range.type === 'NdArray') ctx.updateRangeData(key, coverage.uuid, range);
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
				const info = ctx.rangeInfo.get(key);
				const data = rows[0][key];
				let color = info?.color.primary;
				if (param.categoryEncoding) {
					const catId = param.categoryEncoding
						.entries()
						.find(([, values]) => values.some((v) => v === data))?.[0];
					if (catId) color = info?.color.categories?.get(catId);
				}
				return {
					key,
					label: info?.label,
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
		props.data = rows.map((v) => ({ ...v, t: isUndefined(v.t) ? undefined : new Date(v.t) }));
		props.series = ctx.rangeInfo
			.entries()
			.filter(([key]) => ctx.selected.has(key))
			.filter(([key]) => coverage.ranges.has(key))
			.map(([key, info]) => [key, info] as const)
			.toArray()
			.map(([key, { color, label }]) => {
				return {
					key,
					label,
					color: color.primary
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

	function generateLinearGradientStops(
		{ yScale, padding, height }: ChartState<any, AnyScale, AnyScale>,
		info: RangeSummary
	): [number, string][] {
		const stops: [number, string][] = [];
		const { top, bottom } = padding;
		const getOffset = (v: number) => yScale(v) / (height + top + bottom);
		const param = ctx.parameters.get(info.key)!;
		const categoryValues = param
			.categoryEncoding!.values()
			.toArray()
			.flat()
			.sort((a, b) => b - a);
		for (let num of categoryValues) {
			const catId = param.getCategoryId(num)?.id;
			if (!catId) stops.push([getOffset(num), info.color.primary]);
			else stops.push([getOffset(num), info.color.categories!.get(catId) || info.color.primary!]);
		}
		return stops;
	}

	function resolveTooltipInfo({ name, value }: { name: string; value: unknown }) {
		const info = ctx.rangeInfo.get(name);
		const param = ctx.rangeInfo.get(name);

		const categoryId = param.getCategoryId(value as number)?.id;
		if (!catId)
			return {
				color: info.color.primary!,
				categoryId: undefined
			};
		return {
			color: info.color.categories.get(categoryId)!,
			categoryId
		};
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
					>
						{#snippet formatter(props)}
							{@const info = resolveTooltipInfo(props)}
							<div
								class={cn(
									'flex w-full items-stretch gap-2 [&>svg]:size-2.5 [&>svg]:text-muted-foreground'
								)}
							>
								<div style="background-color:{info.color};border-color:{info.color}"></div>
							</div>
						{/snippet}
					</Chart.Tooltip>
				{/snippet}
				{#snippet marks({ context })}
					{#each context.series.series as serie, i (i)}
						{@const info = ctx.rangeInfo.get(serie.key)};
						{#if !info?.color?.categories}
							<Spline y={serie.key} stroke={serie.color} />
						{:else}
							<LinearGradient
								vertical
								stops={generateLinearGradientStops(context, info)}
								units="userSpaceOnUse"
							>
								<!-- Make the label show the category/color when hovered/clicked -->
								{#snippet children({ gradient })}
									<Spline y={serie.key} stroke={gradient}></Spline>
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
{/if}
