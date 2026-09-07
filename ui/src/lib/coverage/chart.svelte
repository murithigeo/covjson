<script module lang="ts">
	import { Coverage, isUndefined, minMax, type DataRow } from '@murithigeo/covjson-core';
	import {
		LineChart,
		LinearGradient,
		Highlight,
		type LineChartProps,
		BarChart,
		type BarChartProps,
		type ChartProps
	} from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import EmptyChart from '$lib/empty/chart.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Parameter } from '@murithigeo/covjson-core';
</script>

<script lang="ts">
	import { getCoverageCtx } from './coverage-ctx.svelte.ts';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';

	interface Props {
		coverage: Coverage;
	}
	let { coverage = $bindable() }: Props = $props();
	const [ctx, cCtx] = [getDashCtx(), getCoverageCtx()];

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
	let data = $derived.by(() => {
		if (!rows.length) return undefined;
		const props: ChartProps<AugmentedDataRow> = {
			brush: { axis: 'both' },
			transform: { mode: 'domain', axis: 'both' },
			highlight: { lines: true, points: true, axis: 'both' }
			// yNice: true
		};
		// props.props = {};
		if (rows.length === 1) {
			const parameters = ctx.parameters
				.entries()
				.filter(([key]) => coverage.ranges.has(key))
				.filter(([key]) => ctx.selected.has(key))
				.map(([key, param]) => [key, param] as const)
				.toArray();
			props.series = parameters.map(([key, param]) => {
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
			});
			props.x = 'key';
			props.y = 'value';
			props.axis = 'x';
			props.rule = true;

			// props.props.bars = {
			// 	stroke: 'none',
			// 	rounded: 'all',
			// 	radius: 8,
			// 	motion: { type: 'tween', duration: 500 }
			// };
			// props.x1Scale = scaleBand().padding(0.25);
		} else {
			props.props = {};
			props.x = xAxis;
			props.series = Object.values(ctx.chartConfig);
			props.data = rows.map((row) => ({
				...row,
				t: isUndefined(row.t) ? undefined : new Date(row.t)
			}));
			props.props.xAxis = {
				label: xAxis === 't' ? 'Date[Time]' : xAxis === 'z' ? 'Elevation' : 'Node'
			};
		}
		return props;
	});
	$inspect(data);
</script>

{#if !data}
	<EmptyChart status="loaded" />
{:else}
	<Chart.Container config={ctx.chartConfig}>
		{#if rows.length === 1}
			<BarChart {...data}>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel />
				{/snippet}
			</BarChart>
		{:else}
			<LineChart {...data}>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel />
				{/snippet}
			</LineChart>
		{/if}
	</Chart.Container>
{/if}
