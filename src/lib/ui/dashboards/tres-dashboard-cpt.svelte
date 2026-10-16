<svelte:options customElement="tres-dashboard" />

<script lang="ts">
	import type { DashboardProps } from './utils/types.d.ts';
	import CoverageComponent from '#lib/ui/coverage/coverage-cpt.svelte';
	let {
		onIndicesChange = $bindable(),
		data: coverages = $bindable([]),
		children
	}: DashboardProps = $props();
</script>

<div class="h-screen w-full md:grid md:grid-cols-2">
	<div class="h-75 bg-[#555] md:h-full">
		{@render children?.()}
	</div>
	<div class="h-full space-y-2 overflow-y-auto">
		{#each [...coverages] as data (data.uuid)}
			<CoverageComponent {data} bind:onIndicesChange />
		{/each}
	</div>
</div>
