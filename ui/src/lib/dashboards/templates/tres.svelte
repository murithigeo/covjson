<svelte:options customElement="covjson-tres-dashboard" />

<script lang="ts">
	import type { DashboardProps } from '../utils/types.d.ts';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ParameterGroupComponent from '$lib/metadata/parameter-group.svelte';
	import ParameterComponent from '$lib/metadata/parameter.svelte';
	import CoverageComponent from '$lib/coverage/coverage.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { type ChartConfig } from '$lib/components/ui/chart/index.js';
	import { setDashCtx } from '../utils/ctx.svelte.ts';
	import DashControlCenter from '../utils/control-center.svelte';
	import EmptyParameters from '$lib/empty/parameter.svelte';
	import EmptyParameterGroups from '$lib/empty/parameter-group.svelte';
	import EmptyCoverages from '$lib/empty/coverage.svelte';
	let { onIndicesChange, data = $bindable(), detail = 'full', children }: DashboardProps = $props();
	import EmptyMap from '$lib/empty/map.svelte';
	const ctx = setDashCtx();
	$effect(() => {
		ctx.onIndicesChange = onIndicesChange;
		ctx.input = data;
		ctx.detail = detail;
	});
</script>

<!-- May be instead of color, use a number to indicate which slot is set to -->
<div class="flex flex-col gap-2 lg:grid lg:grid-cols-3">
	<div class="sticky top-0 h-100 w-full space-y-2 opacity-[1] md:h-screen">
		{#if children}
			{@render children?.()}
		{:else}
			<EmptyMap />
		{/if}
	</div>
	<div class="h- mr-2 flex h-screen flex-col overflow-y-auto" id="parameter-preview">
		<DashControlCenter class="sticky top-0" />

		<Collapsible.Root id="parameter-group-list" open>
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
				{#if !ctx.parameterGroups.size}
					<EmptyParameterGroups />
				{:else}
					{#each ctx.parameterGroups as group, i (i)}
						<ParameterGroupComponent data={group} open={!i} />
					{/each}
				{/if}
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
				{#if !ctx.parameters.size}
					<EmptyParameters />
				{:else}
					{#each ctx.parameters as [key, data], index (key)}
						<ParameterComponent {data} open={!index} {key} />
					{/each}
				{/if}
			</Collapsible.Content>
		</Collapsible.Root>
	</div>
	<div class="flex h-screen w-full flex-col gap-2 overflow-y-auto" id="charts">
		{#if !ctx.coverages.size}
			<EmptyCoverages />
		{:else}
			{#each ctx.coverages as [, coverage], i (i)}
				<CoverageComponent {coverage} />
			{/each}
		{/if}
	</div>
</div>
