<script lang="ts">
	import { type TemporalResolution, parseDateString } from '@murithigeo/covjson-core';
	import { type ComponentProps } from 'svelte';
	import { Slider } from '../components/ui/slider/index.ts';
	interface Props {
		/**
		 * Assumes that the values are sorted
		 */
		values: string[];
		/**
		 * The current temporal value
		 */
		current: string;
		/**
		 * How to format the current value
		 */
		formatter?(v: string, resolution: TemporalResolution): string;
	}

	let { values, current = $bindable(), formatter, ...props }: Props = $props();
</script>

<Slider max={values.length} step={1} />
