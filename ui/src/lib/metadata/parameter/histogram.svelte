<script module lang="ts">
	import { Bar } from 'svelte-chartjs';
	import type { ChartData, ChartOptions } from 'chart.js';
</script>

<script lang="ts">
	import type { FrequencyMap, RangeConfig } from '$lib/statistics.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { isUndefined } from '@murithigeo/covjson-core';
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
	let info = $derived(ctx.rangeInfo.get(parameterKey));
	let data = $derived<ChartData<'bar'>>({
		labels:
			info?.frequency
				?.keys()
				.map((key) => getLabelForCategoryId(key))
				.toArray() || [],
		datasets:
			info?.frequency
				?.entries()
				.map(([key, size]) => ({
					// label: getLabelForCatId(key),
					data: [{ x: getLabelForCategoryId(key), y: size }],
					backgroundColor: info?.color.categories?.get(key) || info.color.primary
				}))
				.toArray() || []
	});
	let options = $derived.by<ChartOptions<'bar'>>(() => {
		return {};
	});
</script>

<Card.Root>
	<Card.Content>
		<Bar {data} {options} />
	</Card.Content>
</Card.Root>
