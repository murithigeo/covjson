<script lang="ts">
	import { getCoverageCtx } from '../coverage-ctx.svelte.ts';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { Meter } from 'bits-ui';
	import { type DataRow } from '@murithigeo/covjson-core';
	const ctx = getDashCtx();
	interface Props {
		data: DataRow;
	}
	let { data = $bindable() }: Props = $props();
	const covCtx = getCoverageCtx();
	let properties = $derived.by(() => {
		return ctx.parameters
			.entries()
			.filter(([key]) => covCtx.coverage?.ranges.has(key) && ctx.selected.has(key))
			.map(([key, param]) => [key, ctx.rangeInfo.get(key)!] as const);
	});
</script>

<div class="flex flex-col">
	{#each pro as row}
		<Meter.Root
			// convert to percents
			min={isUndefined(row.min) || isNull(row.min) ? 0 : row.min}
			max={isUndefined(row.max) || isNull(row.max) ? 0 : row.max}
		/>
	{/each}
</div>
