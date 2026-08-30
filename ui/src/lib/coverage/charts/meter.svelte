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
			.map(([key, param]) => {
				const value = data[key];
				const {
					min = 0,
					max = 0,
					color: { primary, categories },
					label
				} = ctx.rangeInfo.get(key)!;
				let color = primary;
				if (param.categoryEncoding) {
					const catId = param
						.categoryEncoding!.entries()
						.toArray()
						.find(([id, vals]) => vals.includes(value))[0];
					color = categories!.get(catId) || color;
				}
				return [key, { color, min, max, value, label }] as const;
			});
	});
</script>

<div class="flex h-full flex-col">
	{#each properties as [key, { min, max, label, value, color }]}
		<Meter.Root
			class="bg-dark-10 shadow-mini-inset relative h-[15px] overflow-hidden rounded-full"
			// convert to percents
			{min}
			{max}
			{value}
		>
			{console.log({ min, max, label, value, color })}
			<div
				class="shadow-mini-inset h-full w-full flex-1 rounded-full transition-all duration-1000 ease-in-out {color}"
				style="transform: translateX(-{100 - (100 * (value ?? 0)) / max}%)"
			></div>
		</Meter.Root>
	{/each}
</div>
