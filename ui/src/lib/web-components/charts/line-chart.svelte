<script lang="ts">
	import type { LineChartProps } from '../types.d.ts';
	import * as Chart from '../../components/ui/chart/index.ts';
	import { LineChart } from 'layerchart';
	let { config, data, tooltip, ...props }: LineChartProps = $props();
</script>

<!-- This component is intended to be used to visualize series data such as timeseries or vertical series -->
<Chart.Container {config}>
	<LineChart {data} {...props}>
		{#if tooltip}
			{#snippet tooltip()}
				<Chart.Tooltip hideLabel />
			{/snippet}
		{/if}
	</LineChart>
</Chart.Container>
