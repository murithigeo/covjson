<svelte:options customElement="tres-dashboard" />

<script lang="ts">
	import type { DashboardProps } from './utils/types.d.ts';
	import * as Resizable from '#lib/components/ui/resizable/index.js';
	import * as Accordion from '#lib/components/ui/accordion/index.ts';
	import { MediaQuery, SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { Parameter } from '#lib/core/parameters.ts';
	import type { Coverage, RangeStatistics } from '#lib/core/index.ts';
	import CoverageComponent from '#lib/ui/coverage/coverage-cpt.svelte';
	import ParameterComponent from '#lib/ui/metadata/parameter-cpt.svelte';
	import * as Card from '#lib/components/ui/card/index.ts';
	let { onIndicesChange = $bindable(), data = $bindable(), children }: DashboardProps = $props();

	const isMobile = new MediaQuery('max-width: 768px');
	let direction = $derived<'horizontal' | 'vertical'>(isMobile.current ? 'vertical' : 'horizontal');
	let pinned = new SvelteMap<string, Coverage>();
	let selected = new SvelteSet<string>();
	let stats = new SvelteMap<string, RangeStatistics>();

	let coverages = $derived.by(() => {
		if (!data) return pinned;
		return new SvelteMap([...pinned, ...data.map((cov) => [cov.uuid, cov] as const)]);
	});

	let parameters = $derived(
		new SvelteMap<string, Parameter>([...coverages.values().flatMap((v) => v.parameters)])
	);
</script>

<div class="h-screen">
	<Resizable.PaneGroup {direction}>
		<Resizable.Pane defaultSize={55}>
			<div class="h-full w-full">
				{@render children?.()}
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />

		<Resizable.Pane>
			<div class="h-screen space-y-2 overflow-auto">
				{#each coverages as [uuid, coverage], i (i)}
					<CoverageComponent
						data={coverage}
						bind:onIndicesChange
						bind:pinned={() => pinned.has(coverage.uuid), () => pinned.set(uuid, coverage)}
					/>
				{/each}
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
