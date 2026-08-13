<script lang="ts">
	import type { LineChartProps } from '../types.d.ts';
	import * as Chart from '../../components/ui/chart/index.ts';
	import { LineChart } from 'layerchart';
	let {
		config,
		data = $bindable(),
		tooltip,
		selected = $bindable(),
		...props
	}: LineChartProps = $props();
</script>

<Chart.Container {config}>
	<LineChart
		{data}
		series={selected
			.keys()
			.toArray()
			.map((key) => {
				if (!config || !config[key]) return { key, label: key };
				return { ...config[key], key };
			})}
		x="z"
		legend
		{...props}
	>
		<!-- {#if tooltip}
			{#snippet tooltip()}
				<Chart.Tooltip hideLabel />
			{/snippet}
		{/if} -->
	</LineChart>
</Chart.Container>
