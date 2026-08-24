<script lang="ts">
	import type { DashboardProps } from './types.d.ts';
	import { type MinMax, minMax as getMinMax, type Coverage } from '@murithigeo/covjson-core';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	import ParameterGroupComponent from '../parameter-group.svelte';
	import ParameterComponent from '../parameter.svelte';
	import CoverageComponent from '../coverage/coverage.svelte';
	import GlobalControls from '../global-controls.svelte';
	import { Label } from '$lib/components/ui/label/index.js';

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
	let tvalues = $state(new SvelteSet<string>());

	/**
	 * Holds the absolute minimums and maximums of each parameter
	 */
	let rangeMinMaxes = $derived(new SvelteMap<string, MinMax>());
	/**
	 * The current temporal value independent of the values in coverage
	 */
	let now = $state<string>();
	let pinned = $state(new SvelteMap<string, Coverage>());
	let coverages = $derived.by(() => {
		const set = new SvelteMap<string, Coverage>([...pinned]);
		data?.forEach((cov) => set.set(cov.uuid, cov));
		return set;
	});
	// $effect(() => {

	// });
	let dataTypes = new SvelteMap<string, 'float' | 'string' | 'integer'>();
	$effect(() => {
		for (const [id] of parameters) {
			if (dataTypes.has(id)) continue;
			const hasParam = coverages.values().find((cov) => cov.ranges.has(id))!;
			dataTypes.set(id, hasParam?.ranges.get(id)!.dataType);
		}
	});
	// Source - https://stackoverflow.com/a/1484514
	// Posted by Anatoliy, modified by community. See post 'Timeline' for change history
	// Retrieved 2026-08-20, License - CC BY-SA 3.0

	function getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
	let chartConfig = $derived<Chart.ChartConfig>(
		parameters
			.entries()
			.filter(([id]) => selected.has(id))
			.toArray()
			.reduce(
				(l, [id, param]) => ({
					...l,
					[id]: {
						color: getRandomColor(),
						label: param.label.query()?.value || id
					}
				}),
				{}
			)
	);
</script>

<!-- May be instead of color, use a number to indicate which slot is set to -->
<div class="grid grid-cols-1 lg:grid-cols-3">
	<div class="mr-2 flex h-screen flex-col overflow-y-auto" id="parameter-preview">
		<!-- Make collapsible Triggers sticky -->
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
						color={chartConfig[id].color}
					/>
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
	<div class="flex h-screen w-full flex-col gap-2" id="charts">
		<GlobalControls
			tvalues={tvalues
				.keys()
				.toArray()
				.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())}
			bind:now
			class="sticky top-0 w-full bg-[--background]/80 pt-4"
		/>
		<Separator />
		<div class="h-full space-y-3 overflow-y-auto">
			{#if !coverages.size}
				<Label>No Coverages Selected</Label>
			{:else}
				{#each coverages as [, coverage], i (i)}
					<CoverageComponent
						{coverage}
						bind:selected
						bind:rangeMinMaxes
						bind:now
						bind:pinned
						{onIndicesChange}
						bind:list={coverages}
						bind:chartConfig
					/>
				{/each}
			{/if}
		</div>
	</div>
	<div class="sticky top-0 h-screen w-full">
		{@render children?.()}
	</div>
</div>
