<script lang="ts">
	import type { BChartProps as BarChartProps } from './types.d.ts';
	import { BarChart } from 'layerchart';
	import * as Chart from '../components/ui/chart/index.ts';
	import type { Snippet } from 'svelte';

	interface Props extends BarChartProps {
		children?: Snippet;
	}
	let { data, config, children, x = $bindable('t'), orientation, ...props }: Props = $props();
</script>

<Chart.Container {config}>
	<BarChart
		{...props}
		{orientation}
		{data}
		series={Object.entries(config).map(([key, v]) => ({ ...v, key }))}
		axis={orientation === 'horizontal' ? 'y' : undefined}
		y={orientation === 'horizontal' ? x : undefined}
	>
		{@render children?.()}
	</BarChart>
</Chart.Container>
