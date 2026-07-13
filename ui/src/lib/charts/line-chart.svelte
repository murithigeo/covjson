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
	}

	interface Props {
		parameters: SvelteSet<string>;
		data: DataRow<number>[];
		config: Chart.ChartConfig;
		options: Options;
	}
	let {
		data = $bindable(),
		config,
		options = $bindable(),
		parameters=$bindable()
	}: Props = $props();

	
</script>

<Chart.Container {config}>
	<LineChart {data} x={options.xAxis} axis="x" {series} props={{}}></LineChart>
</Chart.Container>
