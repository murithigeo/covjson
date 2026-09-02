<script lang="ts" generics="T extends string|number">
	import { Slider, type SliderMultiRootPropsWithoutHTML } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import { GitCommitHorizontalIcon, LineDotRightHorizontalIcon } from '@lucide/svelte';
	import type { SliderIndex, SliderValue } from './sliders.d.ts';
	import RangeSlider from 'svelte-range-slider-pips';
	interface Props extends Omit<
		SliderMultiRootPropsWithoutHTML,
		'min' | 'max' | 'value' | 'values' | 'formatter' | 'type'
	> {
		min?: T;
		max?: T;
		index?: SliderIndex;
		value?: T;
		values: Array<T>;
		formatter?: (v: T) => T;
		class?: ClassValue;
		onIndexChange?({ index, value }: { index: SliderIndex; value: SliderValue<T> }): void;
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

	$effect(() =>
		onIndexChange?.({ index, value: [values[index[0]], values[index[1]], values[index[2]]] })
	);
</script>

<!-- 
<RangeSlider
	bind:values={index}
	pips
	max={Math.abs(values.length - 1)}
	id="slider"
	class="pips-bottom"
/> -->

<style>
</style>
