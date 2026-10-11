<script lang="ts">
	import type { AxisResolver } from './types';
	import { Slider } from '#lib/components/ui/slider/index.ts';
	import * as Select from '#lib/components/ui/select/index.ts';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.ts';
	import { cn } from '#lib/utils.ts';
	import type { AxisNamesOptions } from '#lib/core/types.js';
	interface Props {
		type: 'select' | 'range';
		resolver?: (idx: number) => ReturnType<AxisResolver>;
		max: number;
		values?: AxisNamesOptions;
		min?: number;
	}
	let { type = $bindable('range'), resolver, max, values = $bindable() }: Props = $props();
	const getValues = () => {
		if (!values) return [];
		if (Array.isArray(values)) return values.map(String);
		return Array(max).keys().toArray().slice(values.start, values.stop).map(String);
	};
	const setValues = (v?: string[]) => {
		console.log(v);
		if (v) values = v.map(Number);
	};
	$inspect(values);
</script>

<div class={cn}>
	{#if type === 'range'}{:else}
		<ToggleGroup.Root
			type="multiple"
			orientation="horizontal"
			bind:value={
				() => {
					const x = getValues();
					console.log(x);
					return x;
				},
				(v) => setValues(v)
			}
		>
			{#each [...Array(max).keys()] as idx (idx)}
				<ToggleGroup.Item value={idx.toString()}>{resolver?.(idx) || idx}</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	{/if}
</div>
