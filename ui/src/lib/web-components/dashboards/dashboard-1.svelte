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
	import ModeWatcher from '../mode-watcher.svelte';
	import ChartCentral from '../charts/chart-central.svelte';

	let {
		onIndicesChange,
		data: coverage = $bindable(),
		detail,
		children
	}: DashboardProps = $props();
	let selected = $derived(new SvelteSet(coverage?.parameters.keys()));
	$inspect(coverage);
	let rangeMinMaxes = $derived(new SvelteMap<string, MinMax>());
</script>

<!-- May be instead of color, use a number to indicate which slot is set to -->
<div class="grid grid-cols-3">
	<div class="flex flex-col" id="parameter-preview">
		<ModeWatcher />
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
			<Collapsible.Content class="">
				{#each coverage?.parameterGroups as group, i (i)}
					<ParameterGroupComponent data={group} bind:selected {detail} />
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
			<Collapsible.Content>
				{#each coverage?.parameters as [id, data] (id)}
					<ParameterComponent {data} bind:selected {detail} />
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
	<div class="flex flex-col gap-2" id="charts">
		<ChartCentral bind:selected bind:coverage type="line" {onIndicesChange} bind:rangeMinMaxes />
	</div>
	<div class="h-screen w-full">
		{@render children?.()}
	</div>
</div>
