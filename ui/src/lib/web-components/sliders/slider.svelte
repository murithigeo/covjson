<script lang="ts" generics="T extends string|number">
	import { Slider, type SliderRootProps } from 'bits-ui';
	import { SeparatorVerticalIcon, SignpostIcon } from '@lucide/svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';

	type Index = [number, number, number];
	interface Props extends Pick<SliderRootProps, 'step' | 'onValueCommit'> {
		min?: T;
		max?: T;
		index?: Index;
		value?: T;
		values: Array<T>;
		formatter?: (v: T) => T;
		class?: ClassValue;
		orientation?: 'horizontal' | 'vertical';
		step?: number | number[];
		onIndexChange?: (index: Index) => void;
	}

	let {
		values = $bindable(),
		min = $bindable(),
		max = $bindable(),
		index = $bindable([0, 0, values.length]),
		value = $bindable(),
		formatter = (val) => val,
		orientation = 'horizontal',
		step = $bindable(),
		class: className,
		onIndexChange
	}: Props = $props();

	$effect(() => onIndexChange?.(index));
</script>

<Slider.Root
	{step}
	{orientation}
	type="multiple"
	bind:value={index}
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
