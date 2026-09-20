<script lang="ts" generics="T extends any">
	import type { ClassValue } from 'clsx';
	import type { SliderIndex, SliderValue } from './sliders.d.ts';
	import RangeSlider from 'svelte-range-slider-pips';
	import type { Component } from 'svelte';
	type RangeProps = Component<typeof RangeSlider>;

	interface Props extends Omit<
		RangeProps,
		'min' | 'max' | 'value' | 'values' | 'formatter' | 'type' | 'rangeFormatter'
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
</script>

<RangeSlider
	bind:values={index}
	{...props}
	pips
	max={Math.abs(values.length - 1)}
	min={0}
	id="slider"
	class="pips-bottom"
	float
	rangeFloat
	rangeFormatter={formatter}
/>

<style>
</style>
