<script lang="ts">
	// Houses the logic to load and visualize data
	import { Coverage, minMax, type DataRow, isUndefined } from '@murithigeo/covjson-core';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { LineChart, BarChart, type LineChartProps, type BarChartProps } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.ts';
	import { getCoverageCtx } from './coverage-ctx.svelte.ts';
	import EmptyChart from '$lib/empty/chart.svelte';

	interface Props {
		coverage: Coverage;
	}
	let { coverage = $bindable() }: Props = $props();
	const ctx = getDashCtx();
	const covCtx = getCoverageCtx();
	let indices = $derived(covCtx.indices);
	let selected = $derived(ctx.selected);
	let config = $derived(ctx.chartConfig);
	const isNull = (v: any): v is null => v === null;

	let preloadAxis = $derived.by<string[]>(() => {
		const preloadAxis = Array<string>();
		if (coverage.domainType === 'Grid') {
			const { z, t } = coverage;
			// Load all t values for this map of indices because t is the x-axis
			if (z.length > 1 && t.length < 2) preloadAxis.push('t');
			// Else chart against z axis
			else preloadAxis.push('z');
		}
		return preloadAxis;
	});
	let dataPromise = $derived.by(async () => {
		const data = await coverage.query(...preloadAxis)(indices, selected.keys().toArray());
		coverage.ranges.forEach((value, key) => {
			if (!selected.has(key)) return;
			ctx.updateRangeData(key, coverage.uuid, value);
		});
		return data;
	});

	let lineChartProps = (data: DataRow[]) => {
		const props: LineChartProps<DataRow> = {};
		props.series = [];
		props.props = {};
		for (const key in config)
			props.series.push({ ...config[key], key, selected: selected.has(key) });
		props.props = { xAxis: {} };
		switch (coverage.domainType) {
			case 'Grid':
				if (coverage.z.length < 2) {
					props.x = 't';
					props.props.xAxis = { label: 'DateTime' };
				} else {
					props.x = 'z';
					props.props.xAxis = { label: 'Elevation' };
				}
				break;
			case 'Section':
				props.x = 'z';
				props.props.xAxis = { label: 'Elevation' };
				break;
			case 'Trajectory':
				props.x = (d) => coverage.t[d];
				props.props.xAxis = { label: 'Date-Time/Position' };
				break;
			case 'MultiPointSeries':
			case 'MultiPolygonSeries':
			case 'PointSeries':
			case 'PolygonSeries':
				props.x = 't';
				props.props.xAxis = { label: 'Date-Time' };
				break;
		}
		// props.annotations = [{ type: 'line' }];
		props.yDomain = minMax(
			ctx.rangeInfo
				.entries()
				.filter(([key]) => ctx.selected.has(key))
				.flatMap(([, { min, max }]) => [min, max])
				.toArray()
		);
		props.brush = { axis: 'both' };
		props.transform = { mode: 'domain', axis: 'both' };
		console.log({ props });
		return props;
	};

	let barChartProps = () => {
		const props: BarChartProps<DataRow> = {};

		return props;
	};
</script>

<Chart.Container {config} class="h-full w-full ">
	{#await dataPromise}
		<EmptyChart loaded={false} />
	{:then data}
		{#if !data.length}
			<EmptyChart loaded />
		{:else if data.length === 1}
			<BarChart {...barChartProps(data)} {data} />
		{:else}
			<LineChart {...lineChartProps()} {data}>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel />
				{/snippet}
			</LineChart>
		{/if}
	{/await}
</Chart.Container>
