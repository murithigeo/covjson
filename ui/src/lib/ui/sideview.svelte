<script lang="ts">
	import * as Collapsible from '../components/ui/collapsible/index.ts';
	import { type Coverage, type ParameterGroup, type Parameter } from '../core/index.ts';
	import * as Item from '../components/ui/item/index.ts';
	import { buttonVariants } from '../components/ui/button/index.ts';
	import ParameterGroupList from './parameter-group-list.svelte';
	import ParameterList from './parameter-list.svelte';

	import { ChevronsUpDownIcon, GroupIcon, BanIcon, VariableIcon,ChartLineIcon } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	interface Props {
		coverage: Coverage;
		parameters: Record<string, Parameter>;
		parameterGroups?: ParameterGroup[];
		activeParameters?: SvelteSet<string>;
	}

	let {
		coverage = $bindable(),
		parameters = $bindable(),
		parameterGroups,
		activeParameters = $bindable()
	}: Props = $props();
</script>

<Collapsible.Root class="max-sm w-full" disabled={!parameterGroups}>
	<Item.Root size="sm" variant="outline">
		<Item.Media>
			<GroupIcon class="size-4" />
		</Item.Media>
		<Item.Content>
			<Item.Title lang="en">Parameter Groups</Item.Title>
			<Item.Description>Groups related parameters</Item.Description>
		</Item.Content>
		<Item.Actions
			><Collapsible.Trigger
				class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
			>
				{#if parameterGroups}
					<ChevronsUpDownIcon class="size-4" />
				{:else}
					<BanIcon class="size-4" />
				{/if}
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>

	<Collapsible.Content>
		<ParameterGroupList bind:selected={activeParameters} data={parameterGroups!} />
	</Collapsible.Content>
</Collapsible.Root>

<Collapsible.Root class="max-sm w-full" disabled={!parameters}>
	<Item.Root size="sm" variant="outline">
		<Item.Media><VariableIcon class="size-4" /></Item.Media>
		<Item.Content>
			<Item.Title lang="en">Parameters</Item.Title>
			<Item.Description>Variable Metadata</Item.Description>
		</Item.Content>
		<Item.Actions
			><Collapsible.Trigger
				class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
			>
				{#if parameters}
					<ChevronsUpDownIcon class="size-4" />
				{:else}
					<BanIcon class="size-4" />
				{/if}
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>

	<Collapsible.Content>
		<ParameterList bind:selected={activeParameters} data={parameters} />
	</Collapsible.Content>
</Collapsible.Root>



<Collapsible.Root class="max-sm w-full" >
	<Item.Root size="sm" variant="outline">
		<Item.Media><ChartLineIcon class="size-4" /></Item.Media>
		<Item.Content>
			<Item.Title lang="en">Charts</Item.Title>
			<Item.Description>Variable visualization</Item.Description>
		</Item.Content>
		<Item.Actions
			><Collapsible.Trigger
				class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
			>
				{#if parameters}
					<ChevronsUpDownIcon class="size-4" />
				{:else}
					<BanIcon class="size-4" />
				{/if}
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>

	<Collapsible.Content>
	</Collapsible.Content>
</Collapsible.Root>

