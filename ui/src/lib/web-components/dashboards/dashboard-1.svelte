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
	import ChartCentral from '../charts/chart-central.svelte';

	let {
		onIndicesChange,
		data: coverage = $bindable(),
		detail,
		children,
		coveragecollection = $bindable(),
		pageWith = $bindable('z') // move from this to dynamic paging key
	}: DashboardProps = $props();

	let selected = $derived(new SvelteSet(coverage?.parameters.keys()));
	let indices = $derived(new SvelteMap(coverage?.indices));
	let page = $state(1);
	$effect(() => onIndicesChange?.(coverage?.uuid, indices));
	let dataHandler = $derived(coverage?.query(pageWith === 'z' ? 't' : 'z', 'z'));
	let data = $derived(dataHandler?.(indices, selected.keys().toArray()));
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
		<GearStick bind:coverage bind:page bind:indices bind:pageWith />
		<ChartCentral bind:indices bind:selected bind:coverage type="line" />
	</div>
	<div class="h-screen w-full">
		{@render children?.()}
	</div>
</div>
