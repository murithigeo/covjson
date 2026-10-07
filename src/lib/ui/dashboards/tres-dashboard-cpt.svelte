<svelte:options customElement="tres-dashboard" />

<script lang="ts">
	import type { DashboardProps } from './utils/types.d.ts';
	import * as Resizable from '#lib/components/ui/resizable/index.js';
	import * as Accordion from '#lib/components/ui/accordion/index.ts';
	import { MediaQuery, SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { Parameter, ParameterGroup } from '#lib/core/parameters.ts';
	import type { Coverage, RangeStatistics } from '#lib/core/index.ts';
	import CoverageComponent from '#lib/ui/coverage/index-cpt.svelte';
	import ParameterComponent from '#lib/ui/metadata/parameter-cpt.svelte';
	import ParameterGroupComponent from '#lib/ui/metadata/parameter-group-cpt.svelte';
	import * as Card from '#lib/components/ui/card/index.ts';
	let { onIndicesChange = $bindable(), data = $bindable(), children }: DashboardProps = $props();

	const isMobile = new MediaQuery('max-width: 768px');
	let direction = $derived<'horizontal' | 'vertical'>(isMobile.current ? 'vertical' : 'horizontal');
	let pinned = new SvelteMap<string, Coverage>();
	let selected = new SvelteSet<string>();
	let stats = new SvelteMap<string, RangeStatistics>();

	let coverages = $derived.by(() => {
		if (!data) return pinned;
		return new SvelteMap([...pinned, ...data.map((cov) => [cov.uuid, cov] as const)]);
	});

	let parameters = $derived(
		new SvelteMap<string, Parameter>([...coverages.values().flatMap((v) => v.parameters)])
	);
</script>

<div class="h-screen">
	<Resizable.PaneGroup {direction}>
		<Resizable.Pane defaultSize={55}>
			<div class="h-full w-full">
				{@render children?.()}
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />

		<Resizable.Pane>
			<Card.Root>
				<Card.Content class="h-screen overflow-auto">
					<Accordion.Root type="multiple" value={['parameters', 'coverages']}>
						<Accordion.Item value="parameters">
							<Accordion.Trigger>Parameters</Accordion.Trigger>
							<Accordion.Content>
								<div class="">
									{#each parameters as [k, data] (k)}
										<ParameterComponent
											stats={stats.get(k)}
											{data}
											bind:checked={
												() => selected.has(k),
												(checked) => {
													if (checked) selected.add(k);
													else selected.delete(k);
												}
											}
										/>
									{/each}
								</div>
							</Accordion.Content>
						</Accordion.Item>
						<Accordion.Item value="parameterGroups">
							<Accordion.Trigger>Parameter Groups</Accordion.Trigger>
							<Accordion.Content></Accordion.Content>
						</Accordion.Item>
						<Accordion.Item value="coverages">
							<Accordion.Trigger>Coverages</Accordion.Trigger>
							<Accordion.Content>
								<div class="">
									{#each coverages as [uuid, coverage], i (i)}
										<CoverageComponent
											bind:selected
											data={coverage}
											bind:onIndicesChange
											show={{ parameterGroups: true, parameters: true }}
											bind:pinned={
												() => pinned.has(coverage.uuid), () => pinned.set(uuid, coverage)
											}
										/>
									{/each}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				</Card.Content>
			</Card.Root>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
<!-- 
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
</Resizable.PaneGroup> -->
