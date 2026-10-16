<svelte:options customElement="tres-dashboard" />

<script lang="ts">
	import CoverageComponent from '#lib/ui/coverage/coverage-cpt.svelte';
	import type { Coverage, OnIndicesChange } from '#lib/core/index.ts';
	import type { Snippet } from 'svelte';
	interface Props {
		onIndicesChange?: OnIndicesChange;
		children?: Snippet;
		data: Coverage[];
	}
	let {
		onIndicesChange = $bindable(),
		data: coverages = $bindable([]),
		children
	}: Props = $props();
</script>

<div class="h-screen w-full md:grid md:grid-cols-2">
	<div class="h-75 md:h-full">
		{@render children?.()}
	</div>
	<div class="h-full space-y-2 overflow-y-auto">
		{#each [...coverages] as data (data.uuid)}
			<CoverageComponent {data} bind:onIndicesChange />
		{/each}
	</div>
</div>
