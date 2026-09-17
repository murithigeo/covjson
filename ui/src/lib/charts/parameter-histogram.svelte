<script module lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { BarChart } from 'layerchart';
	import type { ChartConfig } from './types.d.ts';
</script>

<script lang="ts">
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import type { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';

	interface Props {
		parameter: ReactiveParameter;
	}
	let { parameter = $bindable() }: Props = $props();

	const ctx = getDashCtx();

	let config = $derived.by<ChartConfig>(() => {
		if (!parameter.stats.frequency) return {};
		const values = parameter.stats.frequency?.keys().map((key) => {
			const category = parameter.categories.get(key)!;
			return [
				key,
				{
					key,
					label: category.label.query()?.value || key,
					color: category.color
				}
			];
		});
		return Object.fromEntries(values);
	});
	let data = $derived(
		parameter.stats.frequency
			?.entries()
			.map(([key, value]) => ({ key, value }))
			.toArray()
	);
	$inspect(data, parameter.stats.frequency);
</script>

{#if parameter.stats.frequency}
	<Card.Root>
		<Card.Content>
			<Chart.Container {config}>
				<BarChart series={Object.values(config)} {data}></BarChart>
				<!-- {#if info && info.frequency}
			<BarChart
				data={info.frequency?.entries().map(([key, size]) => ({ [key]: size }))}
				series={info.color.categories
					?.entries()
					.map(([key, color]) => ({ key, label: getLabelForCategoryId(key) || info.label, color }))}
			/>
		{/if} -->
			</Chart.Container>
		</Card.Content>
	</Card.Root>
{/if}
