<script lang="ts" module>
	import { Line, Bar, Chart } from 'svelte-chartjs';
	import type { ChartData, ChartOptions } from 'chart.js';
</script>

<script lang="ts">
	// Houses the logic to load and visualize data
	import { Coverage, type DataRow, Parameter } from '@murithigeo/covjson-core';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { getCoverageCtx } from './coverage-ctx.svelte.ts';
	import EmptyChart from '$lib/empty/chart.svelte';
	interface Props {
		coverage: Coverage;
	}

	let { coverage = $bindable() }: Props = $props();

	const ctx = getDashCtx();
	const covCtx = getCoverageCtx();
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
	let indices = $derived(covCtx.indices);
	let selected = $state(ctx.selected);

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

	let data = $derived.by<ChartData<'bar' | 'line'> | undefined>(() => {
		if (!rows.length) return undefined;
		const parameters: [string, Parameter][] = ctx.parameters
			.entries()
			.filter(([key]) => coverage.ranges.has(key))
			.filter(([key]) => selected.has(key))
			.toArray();

		return {
			labels: rows.length === 1 ? parameters.map(([key]) => key) : rows.map((row) => row[xAxis]),
			datasets: parameters.map(([key, param]) => {
				const info = ctx.rangeInfo.get(key);
				const colors: Record<number, string | undefined> = {};
				if (typeof info?.max === 'number') colors[info.max] = info.color.primary;

				param.categoryEncoding?.forEach((values, catId) => {
					const color = info?.color.categories?.get(catId);
					for (const value of values) {
						colors[value] = color || info?.color?.primary;
					}
				});

				return {
					data: rows.map((row) => row[key] as number),
					gradient: {
						borderColor: { axis: 'y', colors },
						backgroundColor: { axis: 'y', colors } // Pass option to enable this
					}
				};
			})
		} as ChartData<'line'>;
	});

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
		if (rows.length === 1) delete options.scales.x;
		options.responsive = true;
		return options;
	});

	let dataPromise = $derived.by(async () => {
		rows = await coverage.query(xAxis)(indices, selected.keys().toArray());
		// setRows(rows);
	});
	// function setRows(data: DataRow[]) {
	// 	rows = data;
	// }
	$effect(() => {
		dataPromise;
	});
</script>

<div class="w-full">
	{#if !data}
		<EmptyChart status="loaded" />
	{:else if rows.length === 1}
		<Bar data={data as ChartData<'bar'>} {options} />
	{:else}
		<Line data={data as ChartData<'line'>} {options} />
	{/if}
</div>
