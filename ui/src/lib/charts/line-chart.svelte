<script lang="ts">
	import type { DataRow } from './types.d.ts';
	import { LineChart } from 'layerchart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { curveNatural } from 'd3-shape';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { SvelteSet } from 'svelte/reactivity';

	type AxisId = 'z' | 't';
	interface Options {
		xAxis: AxisId;
		// yAxis: AxisId//Exclude<AxisId,Options["xAxis"]>
	}

	interface Props {
		data: DataRow<number>[];
		config: Chart.ChartConfig;
		options: Options;
	}
	let { data = $bindable(), config = $bindable(), options = $bindable() }: Props = $props();

	const series = $derived.by(() => {
		const uniqueIds = new Set(
			data.flatMap((k) => Object.keys(k)).filter((v) => v !== 't' && v !== 'z')
		);

		return Array.from(uniqueIds).map((key) => ({ ...config[key], key }));
	});
</script>

<Chart.Container {config}>
	<LineChart {data} x={options.xAxis} axis="x" {series} props={{}}></LineChart>
</Chart.Container>
