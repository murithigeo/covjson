<script lang="ts">
	import type { DashboardProps } from './types.d.ts';
	import { type MinMax, minMax as getMinMax } from '@murithigeo/covjson-core';
	import * as Collapsible from '../../components/ui/collapsible/index.ts';
	import * as Item from '../../components/ui/item/index.ts';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { buttonVariants } from '../../components/ui/button/index.ts';
	import ParameterGroupComponent from '../parameter-group.svelte';
	import ParameterComponent from '../parameter.svelte';
	import ChartCentral from '../charts/chart-central.svelte';
	import GlobalControls from '../charts/global-controls.svelte';
	let {
		onIndicesChange,
		data: coverage = $bindable(),
		detail,
		children,
		maxSlots = $bindable()
	}: DashboardProps = $props();
	let selected = $derived(new SvelteSet(coverage?.parameters.keys()));
	/**
	 * Holds all valid temporal value strings
	 */
	let tvalues = $derived(new SvelteSet<string>(coverage?.t));
	/**
	 * Holds the absolute minimums and maximums of each parameter
	 */
	let rangeMinMaxes = $derived(new SvelteMap<string, MinMax>());
	/**
	 * The current temporal value independent of the values in coverage
	 */
	let t = $state<string>();
</script>

<!-- May be instead of color, use a number to indicate which slot is set to -->
<div class="grid grid-cols-3">
	<div class="mr-2 flex flex-col" id="parameter-preview">
		<Collapsible.Root id="parameter-group-list" disabled={!coverage?.parameterGroups.length} open>
			<Item.Root size="sm" variant="outline">
				<Item.Media><GroupIcon class="size-5" /></Item.Media>
				<Item.Content>
					<Item.Title lang="en">Parameter Groups</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}
						><ChevronsUpDown /></Collapsible.Trigger
					>
				</Item.Actions>
			</Item.Root>
			<Collapsible.Content class="ml-2">
				{#each coverage?.parameterGroups as group, i (i)}
					<ParameterGroupComponent data={group} bind:selected {detail} open={!i} />
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
		<Collapsible.Root id="parameter-list" open>
			<Item.Root size="sm" variant="outline">
				<Item.Media><GroupIcon class="size-5" /></Item.Media>
				<Item.Content>
					<Item.Title lang="en">Parameters</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}
						><ChevronsUpDown /></Collapsible.Trigger
					>
				</Item.Actions>
			</Item.Root>
			<Collapsible.Content class="ml-2">
				{#each coverage?.parameters as [id, data], index (id)}
					<ParameterComponent {data} bind:selected {detail} open={!index} />
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
	<div class="flex w-full max-w-sm flex-col space-y-2" id="charts">
		<GlobalControls bind:tvalues bind:t class="sticky top-0 bg-[--background]/80" />
		<ChartCentral bind:selected bind:coverage type="line" {onIndicesChange} bind:rangeMinMaxes />
	</div>
	<div class="h-screen w-full">
		{@render children?.()}
	</div>
</div>
