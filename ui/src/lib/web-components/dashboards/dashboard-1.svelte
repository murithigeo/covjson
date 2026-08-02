<script lang="ts">
	import type { DashboardProps } from './types.d.ts';
	import * as Collapsible from '../../components/ui/collapsible/index.ts';
	import * as Item from '../../components/ui/item/index.ts';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { buttonVariants } from '../../components/ui/button/index.ts';
	import ParameterGroupComponent from '../parameter-group.svelte';
	import ParameterComponent from '../parameter.svelte';
	import ModeWatcher from '../mode-watcher.svelte';

	type Props = DashboardProps;
	let { onIndicesChange, data = $bindable(), detail, children }: Props = $props();
	let selected = $derived(new SvelteSet(data?.parameters.keys()));

	$effect(() => {
		if (!data) return;
		onIndicesChange?.(data.uuid, data.indices);
	});
</script>

<div class="grid grid-cols-3">
	<div class="flex flex-col" id="parameter-preview">
		<ModeWatcher />
		<Collapsible.Root id="parameter-group-list" disabled={!data?.parameterGroups.length} open>
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
				{#each data?.parameterGroups as group, i (i)}
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
				{#each data?.parameters as [id, param] (id)}
					<ParameterComponent data={param} bind:selected {detail} />
				{/each}
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
	<div class="" id="charts"></div>
	<div class="h-screen w-full">
		{@render children?.()}
	</div>
</div>
