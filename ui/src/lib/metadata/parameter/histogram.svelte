<script module lang="ts">
	import { BarChart } from 'layerchart';
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';

	interface Props {
		parameterKey: string;
	}
	let { parameterKey }: Props = $props();

	const ctx = getDashCtx();

	function getLabelForCategoryId(catId: string | null) {
		if (catId === null) return 'No Data';
		return (
			ctx.parameters
				.get(parameterKey)
				?.observedProperty.categories?.find(({ id }) => id === catId)
				?.label?.query()?.value || catId
		);
	}
	let info = $derived(ctx.rangeInfo.get(parameterKey)?);
</script>

<Card.Root>
	<Card.Content>
		<!-- {#if info && info.frequency}
			<BarChart
				data={info.frequency?.entries().map(([key, size]) => ({ [key]: size }))}
				series={info.color.categories
					?.entries()
					.map(([key, color]) => ({ key, label: getLabelForCategoryId(key) || info.label, color }))}
			/>
		{/if} -->
	</Card.Content>
</Card.Root>
