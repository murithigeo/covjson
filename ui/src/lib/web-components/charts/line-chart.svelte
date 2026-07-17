<script lang="ts">
	import type { BChartProps } from './types.d.ts';
	import { LineChart } from 'layerchart';
	import * as Chart from '../components/ui/chart/index.ts';
	import type { Snippet } from 'svelte';
	interface Props extends BChartProps {
		children?: Snippet;
	}
	let { data, config, children, x = $bindable('t'), orientation, ...props }: Props = $props();
</script>

<Chart.Container {config}>
	<LineChart
		{...props}
		{orientation}
		{data}
		series={Object.entries(config).map(([key, v]) => ({ ...v, key }))}
		axis={orientation === 'horizontal' ? 'y' : undefined}
		y={orientation === 'horizontal' ? x : undefined}
	>
		{@render children?.()}
	</LineChart>
</Chart.Container>
