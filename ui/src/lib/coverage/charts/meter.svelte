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
					//@ts-expect-error
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

<div class="relative flex h-full w-full flex-col">
	{#each properties as [key, { min, max, label, value, color }]}
		<div class="flex w-[60%] flex-col gap-2">
			<div class="flex items-center justify-between text-sm font-medium">
				<span> Tokens used </span>
				<span>{value} / {max}</span>
			</div>
			<Meter.Root
				aria-valuetext="{value} out of {max}"
				{value}
				{min}
				{max}
				class="bg-dark-10 shadow-mini-inset relative h-[15px] overflow-hidden rounded-full"
			>
				<div
					class="shadow-mini-inset h-full w-full flex-1 rounded-full transition-all duration-1000 ease-in-out"
					style="transform: translateX({100 -
						(100 * (Number(value) ?? 0)) / Number(max)}%); background-color:{color}"
				></div>
			</Meter.Root>
		</div>
	{/each}
</div>
