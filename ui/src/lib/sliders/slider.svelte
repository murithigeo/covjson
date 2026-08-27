<script lang="ts" generics="T extends string|number">
	import { Slider, type SliderMultiRootPropsWithoutHTML } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import { GitCommitHorizontalIcon, LineDotRightHorizontalIcon } from '@lucide/svelte';
	/**
	 * min,index,max
	 */
	type Index<T extends string | number> = [T, T, T];
	type OnChangeFn = ({ index, value }: { index: Index<number>; value: Index<T> }) => void;
	interface Props extends Omit<
		SliderMultiRootPropsWithoutHTML,
		'min' | 'max' | 'value' | 'values' | 'formatter' | 'type'
	> {
		min?: T;
		max?: T;
		index?: Index<number>;
		value?: T;
		values: Array<T>;
		formatter?: (v: T) => T;
		class?: ClassValue;
		onIndexChange?: OnChangeFn;
	}

	let {
		values = $bindable(),
		min = $bindable(),
		max = $bindable(),
		index = $bindable([0, 0, Math.abs(values.length - 1)]),
		value = $bindable(),
		formatter = (val) => val,
		class: className,
		onIndexChange,
		...props
	}: Props = $props();

	const getValues = (i: number[]): Index<T> => [values[i[0]], values[i[1]], values[i[2]]];
	$effect(() =>
		onIndexChange?.({ index, value: [values[index[0]], values[index[1]], values[index[2]]] })
	);
</script>

<Slider.Root
	{...props}
	type="multiple"
	bind:value={index}
	max={Math.abs(values.length - 1)}
	class={cn('relative flex h-6 w-full items-center', className)}
>
	{#snippet children({ tickItems, thumbItems })}
		<span class="relative h-1 w-full rounded-full bg-gray-200">
			<Slider.Range class="absolute h-full rounded-full bg-blue-200" />
		</span>

		{#each thumbItems as { index, value } (index)}
			<Slider.Thumb index={0} class="rotate-180"><LineDotRightHorizontalIcon /></Slider.Thumb>
			<Slider.Thumb index={1}><GitCommitHorizontalIcon /></Slider.Thumb>
			<Slider.Thumb index={2}><LineDotRightHorizontalIcon /></Slider.Thumb>
			{#if ![0, values.length - 1].includes(value)}
				<Slider.ThumbLabel {index} position="top">{formatter(values[index])}</Slider.ThumbLabel>
			{/if}
		{/each}
		{#each tickItems as { index } (index)}
			<Slider.Tick {index} />
			<Slider.TickLabel {index} position="bottom">{formatter(values[index])}</Slider.TickLabel>
		{/each}
	{/snippet}
	<!-- todo Render three thumbs. Middle is actual value -->
</Slider.Root>
