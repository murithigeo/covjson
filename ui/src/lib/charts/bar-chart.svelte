<script lang="ts">
	// Also stacks
	import type { BarChartProps } from './types.js';
	import { BarChart } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart/index.js';
	let {
		data = $bindable(),
		config,
		x = $bindable('t'),
		legend,
		orientation,
		...props
	}: BarChartProps = $props();
</script>

<Chart.Container {config}>
	<BarChart
		{...props}
		series={Object.entries(config).map(([key, v]) => ({ ...v, key }))}
		y={orientation === 'horizontal' ? x : undefined}
		x={orientation === 'horizontal' ? undefined : x}
		rule={false}
		grid={false}
		axis={orientation === 'horizontal' ? 'y' : undefined}
		{legend}
		{data}
	>
		{#snippet belowMarks()}
			<!-- <Highlight. area={{ class: 'fill-muted' }} /> -->
		{/snippet}

		{#snippet tooltip()}
			<Chart.Tooltip />
		{/snippet}
	</BarChart>
</Chart.Container>
