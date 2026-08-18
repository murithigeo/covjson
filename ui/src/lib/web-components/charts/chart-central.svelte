<script lang="ts">
	import type { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { Coverage, type DataRow } from '@murithigeo/covjson-core';
	import { type ChartConfig, Container as ChartContainer } from '$lib/components/ui/chart/index.js';
	import LineChart from './line-chart.svelte';
	import ArcChart from './arc-chart.svelte';

	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { LineChartProps, ArcChartProps } from 'layerchart';

	interface Props {
		/**
		 * @deprecated Remove the illusion of choice
		 */
		type: 'line' | 'bar';
		indices: SvelteMap<string, number>;
		coverage?: Coverage;
		selected?: SvelteSet<string>;
	}

	let { indices = $bindable(), coverage = $bindable(), selected = $bindable() }: Props = $props();

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
		let preloadAxis = ['z', 't']; // todo Generate a Grid with multiple z/t values and check validity
		const data = await coverage?.query(...preloadAxis)(indices, selected?.keys().toArray());
		return data || [];
	});

	let seriesPreset = $derived.by<LineChartProps<DataRow>>(() => {
		//todo synch the minMax to this component
		// Or use the range's minMax but remember to add disclaimer
		const props: LineChartProps<DataRow> = {};
		if (!coverage) return props;
		const { domainType } = coverage;
		props.series = [];
		props.props = {};
		for (const key in config)
			props.series.push({ ...config[key], key, selected: selected?.has(key) });
		props.props = { xAxis: {} };
		switch (domainType) {
			case 'Grid':
				props.x = coverage.t.length > coverage.z.length ? 't' : 'z';
				props.y1 = props.x === 't' ? 'z' : 't'; // fix that z is only displayed when z.length>2
				props.props.xAxis = { label: props.x === 't' ? 'Date-Time' : 'Elevation' };
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

		return props;
	});

	let nonSeriesPreset = $derived.by<ArcChartProps<DataRow> | undefined>(() => {});
</script>

<!-- todo Legend for categorical values and color customization (gradient th)-->
<ChartContainer {config}>
	{#await dataPromise}
		<Skeleton />
	{:then data}
		{#if ['Point', 'MultiPoint', 'Polygon', undefined].includes(coverage?.domain.domainType)}
			<ArcChart {data} {...nonSeriesPreset} />
		{:else}
			<LineChart {data} {...seriesPreset} />
		{/if}
	{/await}
</ChartContainer>
