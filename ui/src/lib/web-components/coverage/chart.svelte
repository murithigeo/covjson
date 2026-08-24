<script lang="ts">
	// Houses the logic to load and visualize data
	import {
		Coverage,
		type MinMax,
		minMax,
		type DataRow,
		isUndefined
	} from '@murithigeo/covjson-core';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { LineChart, ArcChart, type LineChartProps, type ArcChartProps } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	interface Props {
		coverage: Coverage;
		indices: SvelteMap<string, number>;
		selected?: SvelteSet<string>;
		rangeMinMaxes?: SvelteMap<string, MinMax>;
		config: Chart.ChartConfig;
	}

	let {
		coverage = $bindable(),
		config = $bindable(),
		indices = $bindable(),
		selected = $bindable(new SvelteSet(coverage.ranges.keys())),
		rangeMinMaxes = $bindable(
			new SvelteMap(coverage.ranges.entries().map(([id, { minMax }]) => [id, minMax]))
		)
	}: Props = $props();

	const updateMinMax = (data: DataRow[]) => {
		for (const [rangeId, range] of coverage.ranges) {
			if (range.dataType === 'string') continue;
			const values = data
				.map((d) => d[rangeId])
				.filter((v) => !isUndefined(v) && typeof v === 'number');
			const v = [...values, ...(rangeMinMaxes.get(rangeId) || [null, null])].filter(
				(v) => v !== null
			);
			const bounds = [Math.min(...v), Math.max(...v)] as const;
			rangeMinMaxes.set(rangeId, bounds);
		}
	};
	let dataPromise = $derived.by(async () => {
		// const preloadAxis = ['z'];
		const data = await coverage.query()(indices, selected.keys().toArray());
		updateMinMax(data);
		return data;
	});

	let seriesPreset = $derived.by<LineChartProps<DataRow>>(() => {
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
		props.yDomain = rangeMinMaxes
			? minMax(
					rangeMinMaxes
						.entries()
						.filter(([key]) => selected.has(key))
						.flatMap(([, val]) => val)
						.toArray()
				)
			: undefined;
		props.brush = { axis: 'both' };
		props.transform = { mode: 'domain', axis: 'both' };
		return props;
	});
	let nonSeriesPreset = (data: DataRow) => {
		const props: ArcChartProps<DataRow> = {};
		props.series = Object.entries(config).map(([key, config]) => ({
			...config,
			key,
			maxValue: rangeMinMaxes.get(key)?.[1],
			selected: selected.has(key),
			maxValue: Math.max(rangeMinMaxes.values().map(([, max]) => max)),
			data: [data[key]]
		}));
		return props;
	};
</script>

<Chart.Container {config} class="h-full w-full">
	{#await dataPromise}
		<Skeleton />
	{:then data}
		{#if !data.length}
			<span class="w-full">No Data Loaded</span>
		{:else if data.length === 1}
			<ArcChart {...nonSeriesPreset(data[0])} />
		{:else}
			<LineChart {...seriesPreset} {data}>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel />
				{/snippet}
			</LineChart>
		{/if}
	{/await}
</Chart.Container>
