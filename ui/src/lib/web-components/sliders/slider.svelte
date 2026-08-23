<script lang="ts" generics="T extends string|number">
	import { Slider, type SliderThumbLabelProps } from 'bits-ui';
	import type { SvelteSet } from 'svelte/reactivity';
	import { SeparatorVerticalIcon, SignpostIcon } from '@lucide/svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	interface Props {
		min?: T;
		max?: T;
		index?: number;
		value?: T;
		values: Array<T>;
		minIndex?: number;
		maxIndex?: number;
		formatter?: (v: T) => T;
		class?: ClassValue;
		orientation?: 'horizontal' | 'vertical';
		step?: number | number[];
		onIndexChange?: (index: number) => void;
	}

	let {
		values = $bindable(),
		maxIndex = $bindable(set.size),
		minIndex = $bindable(0),
		min = $bindable(),
		max = $bindable(),
		value = $bindable(),
		index = $bindable(0),
		formatter = (val) => val,
		orientation = 'horizontal',
		step = $bindable(),
		class: className
	}: Props = $props();
	const setIndex = ([start, i, stop]: number[]) => {
		if (start > stop) [start, stop] = [stop, start];
		i = Math.min(Math.max(i, start), stop);
		minIndex = start;
		maxIndex = stop;
		index = i;
		value = values[i];
		min = values[start];
		max = values[stop];
	};
	const getIndex = () => [minIndex, index, maxIndex];
</script>

<Slider.Root
	{step}
	data-slot="slider"
	class={cn(
		'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
		className
	)}
	type="multiple"
	bind:value={getIndex, setIndex}
	autoSort={false}
	trackPadding={4}
	max={values.length - 1}
>
	{#snippet children({ tickItems, thumbItems })}
		<span data-slot="slider-track" data-orientation={orientation}>
			<Slider.Range
				class="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full"
			/>
		</span>
		{#each thumbItems as { index } (index)}
			<Slider.Thumb {index}
				>{#if index === 1}
					<SignpostIcon class="size-5" />
				{:else}
					<SeparatorVerticalIcon class="size-5" />
				{/if}
			</Slider.Thumb>
			<Slider.ThumbLabel {index}>{formatter(values[index])}</Slider.ThumbLabel>
		{/each}
		{#each tickItems as { index } (index)}
			<Slider.Tick {index} />
			<Slider.TickLabel {index}>{formatter(values[index])}</Slider.TickLabel>
		{/each}
	{/snippet}
	<!-- todo Render three thumbs. Middle is actual value -->
</Slider.Root>
