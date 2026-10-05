<svelte:options customElement="tres-dashboard" />

<script lang="ts">
	import type { DashboardProps } from '../utils/types.d.ts';
	import * as Resizable from '#lib/components/ui/resizable/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import * as Item from '#lib/components/ui/item/index.js';
	import { ChevronsUpDown, GroupIcon } from '@lucide/svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import ParameterGroupComponent from '#lib/metadata/parameter-group.svelte';
	import ParameterComponent from '#lib/metadata/parameter.svelte';
	import CoverageComponent from '#lib/coverage/index.svelte';
	import { setDashCtx } from '../utils/ctx.svelte.ts';
	// Repurpose to chart brush
	// import DashControlCenter from '../utils/control-center.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	let { onIndicesChange = $bindable(), data = $bindable(), children }: DashboardProps = $props();
	const ctx = setDashCtx();

	$effect(() => ctx.setIndicesCallback(onIndicesChange));
	$effect(() => ctx.setInput(data));

	let direction = $state<'vertical' | 'horizontal'>('vertical');
	const gteMd = new MediaQuery('min-width: 768px');
	function setDirection() {
		if (gteMd.current) direction = 'horizontal';
		else direction = 'vertical';
	}
	$effect(() => setDirection());
</script>

<!-- Sidebar(parameters,pGroups),map, coverages -->
<div class="h-screen">
	<Resizable.PaneGroup {direction}>
		<Resizable.Pane defaultSize={30}>
			<div class="h-[1/2vh] md:h-screen">
				{@render children?.()}
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />

		<Resizable.Pane defaultSize={32}>
			<div class="h-full overflow-auto">
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
							{#each ctx.parameters as [key, data], index (key)}
								<ParameterComponent {data} open={!index} {key} />
							{/each}
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			</div>
		</Resizable.Pane>

		<Resizable.Handle withHandle />
		<Resizable.Pane>
			<div class="h-full overflow-auto" id="charts">
				{#each ctx.coverages as cov (cov[0])}
					<div class="m-2">
						<CoverageComponent coverage={cov[1]} bind:onIndicesChange />
					</div>
				{/each}
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
