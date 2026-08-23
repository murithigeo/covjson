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
	}

	let {
		coverage = $bindable(),
		indices = $bindable(),
		selected = $bindable(new SvelteSet(coverage.ranges.keys())),
		rangeMinMaxes = $bindable(
			new SvelteMap(coverage.ranges.entries().map(([id, { minMax }]) => [id, minMax]))
		)
	}: Props = $props();
	// Source - https://stackoverflow.com/a/1484514
	// Posted by Anatoliy, modified by community. See post 'Timeline' for change history
	// Retrieved 2026-08-20, License - CC BY-SA 3.0

	function getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
	const updateMinMax = (data: DataRow[]) => {
		for (const [rangeId, range] of coverage.ranges) {
			if (range.dataType === 'string') continue;
			const values = data
				.map((d) => d[rangeId])
				.filter((v) => !isUndefined(v) && typeof v === 'number');
			rangeMinMaxes.set(rangeId, minMax([...values, ...(rangeMinMaxes.get(rangeId) || [])]));
		}
	};
	let dataPromise = $derived.by(async () => {
		const preloadAxis = ['z'];
		const data = await coverage.query(...preloadAxis)(indices, selected.keys().toArray());
		updateMinMax(data);
		return data;
	});

	const config = $derived<Chart.ChartConfig>(
		coverage.parameters
			.entries()
			.filter(([id]) => selected.has(id))
			.toArray()
			.reduce(
				(l, [id, param]) => ({
					...l,
					[id]: {
						color: getRandomColor(),
						label: param.label.query()?.value || id
					}
				}),
				{}
			)
	);

	let seriesPreset = $derived.by<LineChartProps<DataRow>>(() => {
		const props: LineChartProps<DataRow> = {};
		props.series = [];
		props.props = {};
		for (const key in config)
			props.series.push({ ...config[key], key, selected: selected?.has(key) });
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
						.filter(([key]) => selected?.has(key))
						.flatMap(([, val]) => val)
						.toArray()
				)
			: undefined;
		props.brush = { axis: 'both' };
		props.transform = { mode: 'domain', axis: 'both' };
		return props;
	});
</script>

<Chart.Container {config}>
	{#await dataPromise}
		<Skeleton />
	{:then data}
		{#if !data.length}
			<span class="w-full">No Data Loaded</span>
		{:else if data.length === 1}
			<ArcChart {...nonSeriesPreset} />
		{:else}
			<LineChart {...seriesPreset} />
		{/if}
	{/await}
</Chart.Container>
