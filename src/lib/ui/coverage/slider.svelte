<script lang="ts">
	import { Slider } from '#lib/components/ui/slider/index.ts';
	import type { AxisNamesOptions } from '#lib/core/types.js';
	import { cn } from '#lib/utils.ts';
	import type { ClassValue } from 'clsx';

	interface Props {
		max: number;
		values?: AxisNamesOptions;
		class?: ClassValue;
		resolver?: (i: number) => string;
	}

	let { max, values = $bindable(), resolver, class: className }: Props = $props();

	// Currently swaps values if hovered. Maybe confirm button
	let value = $state([0, max]);
</script>

<div class={cn('w-full items-center', className)}>
	<Slider
		type="multiple"
		min={0}
		max={max - 1}
		step={1}
		bind:value
		onValueChange={([start, stop]) => {
			console.log({ start, stop });
			values = { start, stop };
		}}
	/>
	<span class="flex flex-wrap"
		>{resolver?.(value[0]) || value[0]} - {resolver?.(value[1]) || value[1]}</span
	>
</div>
