<script lang="ts">
	import type { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { Coverage } from '@murithigeo/covjson-core';
	import { type ChartConfig } from '$lib/components/ui/chart/index.ts';

	interface Props {
		type: 'line' | 'bar';
		indices: SvelteMap<string, number>;
		coverage?: Coverage;
		selected?: SvelteSet<string>;
	}

	let {
		type = $bindable('line'),
		indices = $bindable(),
		coverage = $bindable(),
		selected = $bindable()
	}: Props = $props();

	let config = $derived.by<ChartConfig>(() => {});
</script>
