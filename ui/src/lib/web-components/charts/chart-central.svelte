<script lang="ts">
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		Coverage,
		type DataRow,
		type OnIndicesChange,
		type MinMax,
		minMax,
		isUndefined
	} from '@murithigeo/covjson-core';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import IndicesCentral from './indices-central.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { type LineChartProps, type ArcChartProps, LineChart, ArcChart } from 'layerchart';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { ChevronsUpDownIcon, PinIcon, DeleteIcon, PinOffIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
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

	interface Props {
		coverage: Coverage;
		selected?: SvelteSet<string>;
		onIndicesChange?: OnIndicesChange;
		rangeMinMaxes?: SvelteMap<string, MinMax>;
		t?: string;
		pinned?: SvelteMap<string, Coverage>;
		onRemove?: (uuid: string) => void;
	}

	let {
		coverage = $bindable(),
		selected = $bindable(),
		onIndicesChange,
		t = $bindable(),
		rangeMinMaxes = $bindable(),
		pinned = $bindable(),
		onRemove
	}: Props = $props();

	let config = $derived.by(() => {
		const config: Chart.ChartConfig = {};
		coverage?.parameters?.entries().forEach(([key, value], i) => {
			config[key] = {
				label: value.label.query()?.value || key,
				color: `var(--chart-${i + 1})`
			};
		});
		return config;
	});

	let axesSize = $derived(new SvelteMap(coverage?.axesSize));
	let indices = $derived(new SvelteMap(coverage?.indices));
	let domainType = $derived(coverage?.domainType);
	$effect(() => onIndicesChange?.(coverage, indices));

	const updateMinMax = (data: DataRow[]) => {
		if (!data.length) return;

		for (const [rangeId, range] of coverage.ranges) {
			for (const row of data) {
				const value = row[rangeId];
				if (isUndefined(value)) continue;
				if (typeof value === 'string') continue;
				rangeMinMaxes?.set(rangeId, minMax([...range.minMax, value]));
			}
		}
	};
	let dataPromise = $derived.by(async () => {
		let preloadAxis = ['z']; // todo Generate a Grid with multiple z/t values and check validity
		const data = await coverage?.query(...preloadAxis)(indices, selected?.keys().toArray());
		updateMinMax(data || []);
		return data || [];
	});

	let seriesPreset = $derived.by<LineChartProps<DataRow>>(() => {
		//todo synch the minMax to this component
		// Or use the range's minMax but remember to add disclaimer
		const props: LineChartProps<DataRow> = {};
		props.series = [];
		props.props = {};
		for (const key in config)
			props.series.push({ ...config[key], key, selected: selected?.has(key) });
		props.props = { xAxis: {} };
		switch (domainType) {
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
						?.entries()
						.filter(([key]) => selected?.has(key))
						.flatMap(([, val]) => val)
						.toArray()
				)
			: undefined;
		props.brush = { axis: 'both' };
		props.transform = { mode: 'domain', axis: 'both' };
		return props;
	});

	let nonSeriesPreset = $derived.by<ArcChartProps<DataRow> | undefined>(() => {});

	const handlePin = () => {
		if (pinned?.has(coverage.uuid)) return pinned.delete(coverage.uuid);
		return pinned?.set(coverage.uuid, coverage);
	};
</script>

<!-- done:(used an array) If active coverages are the same, make sure to only use one preview -->
<!-- Add button to allow user to explicitly opt into preloading -->
<!-- todo Legend for categorical values and color customization (gradient th)-->
<!-- Button on each component to remove the module -->
<!-- Add padding so that all chart data is visible -->
<Card.Root>
	<Card.Header>
		<Card.Title></Card.Title>
		<Card.Action>
			<ButtonGroup.Root>
				<Button onclick={handlePin}
					>{#if pinned?.has(coverage.uuid)}<PinOffIcon />
					{:else}
						<PinIcon />
					{/if}</Button
				>
				<Button
					onclick={() => {
						onRemove?.(coverage.uuid);
					}}><DeleteIcon /></Button
				>
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content class="flex flex-col space-y-3">
		<Chart.Container {config}>
			{#await dataPromise then data}
				{#if ['Point', 'MultiPoint', 'Polygon', undefined].includes(coverage?.domain.domainType)}
					<ArcChart {data} {...nonSeriesPreset} />
				{:else}
					<LineChart {data} {...seriesPreset} class="h-full w-full">
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</LineChart>
				{/if}
			{/await}
		</Chart.Container>
	</Card.Content>
	<Card.Footer>
		<IndicesCentral
			bind:axesSize
			bind:indices
			tvalues={new SvelteSet(coverage?.t)}
			bind:domainType
			bind:t
		/>
	</Card.Footer>
</Card.Root>
