<script lang="ts">
	import { getDashCtx } from './ctx.svelte.ts';
	import ModeWatcher from '$lib/mode-watcher.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	import { AreaChart } from 'layerchart';
	const ctx = getDashCtx();

	//For each parameter and for each datetime/z value, compute the average and render the minimap
	// Primarily use datetime and do no use brush on chart groups with no datetime,
	// Retrieve the data at those temporal indices
	/**
	 * Have bins like Map<MultiDate,value:(string|number|null)[]>
	 * Map<number,value:number|string|null[]>
	 */
	// let data = t;
</script>

<ModeWatcher />
<!-- 
<Card.Root>
	<Card.Content class="flex flex-col items-center gap-1">
		<Label>Temporal Bounds</Label>
		<Chart.Container config={ctx.chartConfig} class="h-10 w-full">
			<AreaChart
				padding={{ left: 16 }}
				brush
				series={Object.values(ctx.chartConfig)}
				x="t"
				id="global-temporal-brush"
			></AreaChart>
		</Chart.Container>
		<Label>Elevation Bounds</Label>
		<Chart.Container config={ctx.chartConfig} class="h-10 w-full">
			<AreaChart
				padding={{ left: 16 }}
				brush
				series={Object.values(ctx.chartConfig)}
				x="z"
				id="global-elevation-brush"
			></AreaChart>
		</Chart.Container>
	</Card.Content>
	<Card.Footer>
		<ModeWatcher />
	</Card.Footer>
</Card.Root> -->

<!-- 
<TemporalControl
	values={ctx.tvalues
		.keys()
		.toArray()
		.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())}
	onIndexChange={({ value }) => ctx.setNow(value)}
	{buttonProps}
	class={cn('w-full', className)}
	>{#snippet children()}
	{/snippet}
</TemporalControl> -->
