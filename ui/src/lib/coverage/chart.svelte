<script lang="ts" module>
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		BarElement,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		type ChartData,
		type ChartDataset,
		type ChartOptions
	} from 'chart.js';
	import { Line, Bar, Chart } from 'svelte-chartjs';

	ChartJS.register(
		Title,
		Tooltip,
		LineElement,
		BarElement,
		LinearScale,
		PointElement,
		CategoryScale
	);
</script>

<script lang="ts">
	// Houses the logic to load and visualize data
	import { Coverage, type DataRow, Parameter } from '@murithigeo/covjson-core';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { getCoverageCtx } from './coverage-ctx.svelte.ts';
	import EmptyChart from '$lib/empty/chart.svelte';
	import type { RangeSummary } from '$lib/statistics.ts';
	interface Props {
		coverage: Coverage;
	}

	let { coverage = $bindable() }: Props = $props();
	const ctx = getDashCtx();
	const covCtx = getCoverageCtx();
	let indices = $derived(covCtx.indices);
	let selected = $derived(ctx.selected);

	/**
	 * The axisName to be used as xAxis. Will be preloaded
	 */
	let xAxis = $derived.by<string>(() => {
		const {
			domainType,
			t: { length: tLen },
			z: { length: zLen }
		} = coverage;
		if (domainType === 'Section') return 'z';
		if (domainType === 'Grid') {
			if (!zLen && !tLen) return 'z';
			if (zLen < 2) return 't';
			if (tLen < 2) return 'z';
			return 'z';
		}
		return 't';
	});

	let rows = $state<DataRow[]>([]);
	let data = $state<ChartData<'bar' | 'line'>>({ labels: [], datasets: [] });
	let chart = $state<Chart | null>(null);

	let max = $derived.by(() => {
		const maxes = ctx.rangeInfo
			.entries()
			.filter(([key]) => selected.has(key) && coverage.ranges.has(key))
			.map(([, { max }]) => max)
			.filter((v) => typeof v === 'number');
		return Math.max(...maxes);
	});

	let options = $derived.by(() => {
		const options: ChartOptions<'line' | 'bar'> = {};
		options.scales = {};
		options.scales.y = { max };
		options.scales.x = {};
		options.scales.x.title = { display: true };

		if (xAxis === 't') {
			options.scales.x.title.text = 'z';
			if (coverage.domainType === 'Trajectory' || coverage.domainType === 'Section') {
				options.scales.x.title.text = 'composite';
			}
		}
		options.responsive = true;
		return options;
	});

	let dataPromise = $derived.by(async () => {
		const rows = await coverage.query(xAxis)(indices, selected.keys().toArray());
		coverage.ranges.forEach((value, key) => {
			if (!selected.has(key)) return;
			ctx.updateRangeData(key, coverage.uuid, value);
		});
		return rows;
	});
</script>

{#await dataPromise}
	<EmptyChart status="loading" />
{:then data}
	{#if !data.length}
		<Bar data={{}} bind:chart />
	{:else if data.length === 1}
		<Bar data={{}} {options} />
	{:else}
		<Line data={{}} {options} />
	{/if}
{/await}
