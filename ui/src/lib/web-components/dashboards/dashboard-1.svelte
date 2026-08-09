<script lang="ts">
	import type { DashboardProps } from './types.d.ts';
	import * as Collapsible from '../../components/ui/collapsible/index.ts';
	import * as Item from '../../components/ui/item/index.ts';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { buttonVariants } from '../../components/ui/button/index.ts';
	import ParameterGroupComponent from '../parameter-group.svelte';
	import ParameterComponent from '../parameter.svelte';
	import ModeWatcher from '../mode-watcher.svelte';
	import GearStick from '../indices-switcher.svelte';
	import TemporalControl from '../temporal-control.svelte';

	let {
		onIndicesChange,
		data: coverage = $bindable(),
		detail,
		children,
		coveragecollection = $bindable()
	}: DashboardProps = $props();

	let selected = $derived(new SvelteSet(coverage?.parameters.keys()));
	let page = $state(1);
</script>

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
				{#each coverage?.parameters as [id, param] (id)}
					<ParameterComponent data={param} bind:selected {detail} />
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
	<div class="flex flex-col gap-2" id="charts">
		<GearStick bind:coverage bind:page {onIndicesChange} />
		<TemporalControl
			values={['2021', '2023', '2024']}
			formatter={(v, res) => {
				return v;
			}}
		/>
	</div>
	<div class="h-screen w-full">
		{@render children?.()}
	</div>
</div>
