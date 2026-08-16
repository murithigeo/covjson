<script lang="ts">
	import type { LineChartProps } from './types.d.ts';
	import { LineChart } from 'layerchart';

	let {
		config,
		data = $bindable(),
		tooltip,
		series = $bindable(),
		...props
	}: LineChartProps = $props();
</script>

<LineChart {data} {series} {...props}>
	<!-- {#if tooltip}
			{#snippet tooltip()}
				<Chart.Tooltip hideLabel />
			{/snippet}
		{/if} -->
</LineChart>
