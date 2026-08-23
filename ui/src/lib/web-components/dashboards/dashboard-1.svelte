<script lang="ts">
	import type { DashboardProps } from './types.d.ts';
	import { type MinMax, minMax as getMinMax, type Coverage } from '@murithigeo/covjson-core';
	import * as Collapsible from '../../components/ui/collapsible/index.ts';
	import * as Item from '../../components/ui/item/index.ts';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { buttonVariants } from '../../components/ui/button/index.ts';
	import ParameterGroupComponent from '../parameter-group.svelte';
	import ParameterComponent from '../parameter.svelte';
	import CoverageComponent from '../coverage/coverage.svelte';
	import GlobalControls from '../charts/global-controls.svelte';
	let {
		onIndicesChange,
		data = $bindable(),
		detail,
		children,
		maxSlots = $bindable()
	}: DashboardProps = $props();
	let parameters = $derived(new SvelteMap(data?.flatMap((cov) => [...cov.parameters])));
	let selected = $derived(new SvelteSet(parameters.keys()));
	let parameterGroups = $derived(new SvelteSet(data?.flatMap((cov) => cov.parameterGroups)));
	// On click, disable parameters not in coverage
	let currentCoverageIndex = $state(0);
	/**
	 * Holds all valid temporal value strings
	 */
	let tvalues = $derived(new SvelteSet(data?.flatMap((cov) => cov.t)));
	/**
	 * Holds the absolute minimums and maximums of each parameter
	 */
	let rangeMinMaxes = $derived(new SvelteMap<string, MinMax>());
	/**
	 * The current temporal value independent of the values in coverage
	 */
	let t = $state<string>();
	let pinned = $state(new SvelteMap<string, Coverage>());
	let coverages = $derived.by(() => {
		const set = new SvelteMap<string, Coverage>([...pinned]);
		data?.forEach((cov) => set.set(cov.uuid, cov));
		return set;
	});
	let dataTypes = new SvelteMap<string, 'float' | 'string' | 'integer'>();
	$effect(() => {
		for (const [id] of parameters) {
			if (dataTypes.has(id)) continue;
			const hasParam = coverages.values().find((cov) => cov.ranges.has(id));
			dataTypes.set(id, hasParam.ranges.get(id)!.dataType);
		}
	});
</script>

<!-- May be instead of color, use a number to indicate which slot is set to -->
<div class="grid grid-cols-3">
	<div class="sticky top-0 mr-2 flex h-screen flex-col overflow-y-auto" id="parameter-preview">
		<Collapsible.Root id="parameter-group-list" disabled={!parameterGroups.size} open>
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
				{#each parameterGroups as group, i (i)}
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
				{#each parameters as [id, data], index (id)}
					<ParameterComponent
						{data}
						bind:selected
						{detail}
						open={!index}
						minMax={rangeMinMaxes.get(id)}
						dataType={dataTypes.get(id)}
					/>
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
	<div class="flex h-screen w-full max-w-sm flex-col gap-2" id="charts">
		<GlobalControls bind:tvalues bind:t class="sticky top-0 w-full bg-[--background]/80 pt-4" />
		<div class=" h-full space-y-3 overflow-y-auto">
			{#each coverages as [, coverage], i (i)}
				<CoverageComponent
					{coverage}
					bind:selected
					bind:rangeMinMaxes
					bind:t
					bind:pinned
					{onIndicesChange}
					bind:list={coverages}
				/>
			{/each}
		</div>
	</div>
	<div class="sticky top-0 h-screen w-full">
		{@render children?.()}
	</div>
</div>
