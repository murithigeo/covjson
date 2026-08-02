<!-- A component used to change active indices of the coverage -->
<script lang="ts">
	import type { OnIndicesChange, Coverage } from '@murithigeo/covjson-core';
	import { SvelteMap } from 'svelte/reactivity';
	interface Props {
		coverage?: Coverage; // make the indices generic
		onIndicesChange?: OnIndicesChange;
		/**
		 * For Grid coverages only.
		 * Allows visualization of 4D data values by slicing into tiles either by the "z"|"t" axes
		 */
		page?: number;
		pageWith?: 'z' | 't';
		indices?: SvelteMap<string, number>;
	}
	let {
		coverage = $bindable(),
		onIndicesChange,
		page = $bindable(1),
		pageWith = 't',
		indices = $bindable()
		// Also include code such that the client receives an array of data markers
	}: Props = $props();

	$effect(() => {
		if (!coverage) return;
	});
</script>
