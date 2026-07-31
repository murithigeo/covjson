<script lang="ts">
	import type { DashboardProps } from './types.d.ts';
	import * as Collapsible from '../../components/ui/collapsible/index.ts';
	import * as Item from '../../components/ui/item/index.ts';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { buttonVariants } from '../../components/ui/button/index.ts';
	import { ParameterGroup } from '@murithigeo/covjson-core';
	import ParameterGroupComponent from '../parameter-group.svelte';
	let { onIndicesChange }: DashboardProps = $props();
	let selected = $state(new SvelteSet<string>());
	let parameterGroups = $state<ParameterGroup[]>([]);
	let parameters = $state<Record<string, Parameter>>({});
</script>

<div class="grid grid-cols-3">
	<div class="" id="parameter-preview">
		<Collapsible.Root id="parameter-group-list" disabled={!parameterGroups.length}>
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
				{#each parameterGroups as group, i (i)}
					<ParameterGroupComponent {group} bind:selected />
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
		<Collapsible.Root id="parameter-list">
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
				{#each Object.entries(parameters) as [id, param] (id)}{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
	<div class="" id="chart-1"></div>
	<div class="" id="chart-2"></div>
</div>
