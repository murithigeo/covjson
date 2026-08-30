<script lang="ts" module>
	import { browser } from '$app/environment';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		type ChartData,
		type ChartDataset,
		type ChartOptions
	} from 'chart.js';

	ChartJS.register(Title, Tooltip, LineElement, LinearScale, PointElement, CategoryScale);
</script>

<script lang="ts">
	// Houses the logic to load and visualize data
	import { Coverage, minMax, type DataRow, isUndefined } from '@murithigeo/covjson-core';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { getCoverageCtx } from './coverage-ctx.svelte.ts';
	import EmptyChart from '$lib/empty/chart.svelte';
	import Meter from './charts/meter.svelte';
	import { Line } from 'svelte-chartjs';
	interface Props {
		coverage: Coverage;
	}

	let { coverage = $bindable() }: Props = $props();
	const ctx = getDashCtx();
	const covCtx = getCoverageCtx();
	let indices = $derived(covCtx.indices);
	let selected = $derived(ctx.selected);
	let config = $derived(ctx.chartConfig);

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
	let gradient = $state<LinearGradient>();
	let chartWidth = $state<number>();
	let chartHeight = $state<number>();

	const computeData = (rows: DataRow[]) => {
		const data: ChartData<'line', DataRow> = { datasets: [] };
		data.labels = rows.map((row) => row[xAxis]);
		data.datasets = ctx.parameters
			.entries()
			.filter(([key]) => ctx.selected.has(key) && coverage.ranges.has(key))
			.toArray()
			.map(([key, param]) => {
				const props: ChartDataset<'line', DataRow> = {
					label: param.label.query()?.value || key,
					data: rows.map((row) => row[key]),
					borderColor: ctx.rangeInfo.get(key)!.color!.primary
				};
				if (!param.categoryEncoding) return props;
				props.borderColor = (chart, area) => {
					const {
						color: { primary, categories }
					} = ctx.rangeInfo.get(key)!;

					if (!param.categoryEncoding) return primary;
					const width = area.right - area.left;
					const height = area.bottom - area.top;
					if (!gradient || width !== chartWidth || height !== chartHeight) {
						chartHeight = height;
						chartWidth = width;
						// gradient = (0, area.bottom, 0, area.top);

						for (const [id, values] of param.categoryEncoding) {
							values.forEach((int) => gradient.addColorStop(int, categories!.get(id) || primary));
						}
					}
					return gradient;
				};
				return props;
			});

		return data;
	};
	let dataPromise = $derived.by(async () => {
		const data = await coverage.query(xAxis)(indices, selected.keys().toArray());
		coverage.ranges.forEach((value, key) => {
			if (!selected.has(key)) return;
			ctx.updateRangeData(key, coverage.uuid, value);
		});
		return data;
	});
	let options = () => {
		let options: ChartOptions<'line'> = { scales: { x: {}, y: {} } };
		const [min, max] = minMax(
			ctx.rangeInfo
				.entries()
				.filter(([key]) => ctx.selected.has(key) && coverage.parameters.has(key))
				.flatMap(([, { min, max }]) => [min, max])
				.filter((v) => !isUndefined(v))
				.toArray()
		);
		options.scales.y = { min, max };
		options.scales.x = { title: { display: true } };

		if (xAxis === 't') {
			if (coverage.domainType === 'Trajectory' || coverage.domainType === 'Section') {
				options.scales.x.title = 'composite';
			}
		} else {
			options.scales.x.title.text = 'z';
		}
		return options;
	};
</script>

{#await dataPromise}
	<EmptyChart status="loading" />
{:then data}
	{#if !data.length}
		<EmptyChart status="loaded" />
	{:else if data.length === 1}
		<Meter data={data[0]} />
	{:else}
		<Line data={computeData(data)} options={options()} />
	{/if}
{:catch error}
	{console.log(error)}
	<EmptyChart status="error" {error} />
{/await}
