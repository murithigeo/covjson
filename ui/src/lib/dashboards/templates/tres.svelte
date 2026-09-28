<svelte:options customElement="tres-dashboard" />

<script lang="ts">
	import type { DashboardProps } from '../utils/types.d.ts';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import ParameterGroupComponent from '$lib/metadata/parameter-group.svelte';
	import ParameterComponent from '$lib/metadata/parameter.svelte';
	// import CoverageComponent from '$lib/coverage/coverage.svelte';
	import CoverageComponent from '$lib/coverage/index.svelte';
	import { setDashCtx } from '../utils/ctx.svelte.ts';
	import DashControlCenter from '../utils/control-center.svelte';
	import EmptyParameters from '$lib/empty/parameter.svelte';
	import EmptyCoverages from '$lib/empty/coverage.svelte';
	let {
		onIndicesChange = $bindable(),
		data = $bindable(),
		detail = 'full',
		children
	}: DashboardProps = $props();
	const ctx = setDashCtx();

	const setProperty = <K extends keyof typeof ctx, V extends (typeof ctx)[K]>(key: K, value: V) => {
		ctx[key] = value;
	};
	$effect(() => setProperty('onIndicesChange', onIndicesChange));
	$effect(() => setProperty('input', data));
	$effect(() => setProperty('detail', detail));
</script>

<!-- Sidebar(parameters,pGroups),map, coverages -->
<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane defaultSize={32}>
		<div class="overflow-auto">
			<DashControlCenter />

			<Collapsible.Root
				id="parameter-group-list"
				open={!!ctx.parameterGroups.size}
				disabled={!ctx.parameterGroups.size}
			>
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
					{#each ctx.parameterGroups as group, i (i)}
						<ParameterGroupComponent data={group} open={!i} />
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
				<Collapsible.Content class="ml-2 ">
					<div class="overflow-auto">
						{#if !ctx.parameters.size}
							<EmptyParameters />
						{:else}
							{#each ctx.parameters as [key, data], index (key)}
								<ParameterComponent {data} open={!index} {key} />
							{/each}
						{/if}
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		</div>
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane defaultSize={30} class="sticky top-0 h-screen">
		{@render children?.()}
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane>
		<div class="h-screen overflow-auto" id="charts">
			{#if !ctx.coverages.size}
				<EmptyCoverages />
			{:else}
				{#each ctx.coverages as [, coverage], i (i)}
					<CoverageComponent {coverage} checked={!i} bind:onIndicesChange />
				{/each}
			{/if}
		</div>
	</Resizable.Pane>
</Resizable.PaneGroup>
