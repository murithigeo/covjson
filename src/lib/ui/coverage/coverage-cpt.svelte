<svelte:options customElement="coveragejson-coverage" />

<script lang="ts" module>
	import DataView from './data-view.svelte';
	import AxisConfigurer from './axis-config.svelte';
	import { ChartColumnIcon, TableIcon, SettingsIcon } from '@lucide/svelte';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import * as Card from '#lib/components/ui/card/index.ts';
	import * as Tabs from '#lib/components/ui/tabs/index.ts';
	import ParameterGroup from '../metadata/parameter-group-cpt.svelte';
	import type { Colors } from './types.d.ts';
	import { SvelteSet } from 'svelte/reactivity';
	import * as Accordion from '#lib/components/ui/accordion/index.ts';
	import ParameterCpt from '../metadata/parameter-cpt.svelte';
	import * as Item from '#lib/components/ui/item/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import { CoverageContext, setCovContext } from './ctx.svelte.ts';
	import type { Coverage, OnIndicesChange } from '#lib/core/index.ts';
	import { type BrushDomainType } from 'layerchart';
</script>

<script lang="ts">
	interface Props {
		coverage: Coverage;
		selected?: SvelteSet<string>;
		colors?: Colors;

		/**
		 * Callback to execute when the currently tooltip changes
		 */
		onIndicesChange?: OnIndicesChange;
		/**
		 * Customize if and what in the settings tab is shown
		 */
		show?: {
			/**
			 * Whether to show the parameters in settings tab
			 */
			parameters?: boolean;
			/**
			 * Whether to show the parameterGroups in settings tab
			 */
			parameterGroups?: boolean;
			/**
			 * Whether to show the axis settings in settings
			 */
			axes?: boolean;
		};
	}
	let {
		coverage,
		show = { parameterGroups: true, parameters: !!coverage.rangeIds.length, axes: true },
		selected = $bindable(new SvelteSet([...coverage.ranges.keys(), ...coverage._ranges.keys()])),
		colors = coverage.rangeIds.reduce((l, r) => ({ ...l, [r]: { default: 'black' } }), {}),
		onIndicesChange
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let ctx = setCovContext(new CoverageContext(coverage.denormalize()));

	$effect(() => ctx.setProp('indices', coverage.indices));
	$effect(() => ctx.setProp('onIndicesChange', onIndicesChange));
	$effect.pre(() => ctx.setProp('selected', selected));
	$effect(() => ctx.setProp('active', coverage.rangeIds[0] ?? 'settings'));
	let view = $state<'table' | 'chart'>('chart');
	let xDomain = $state<BrushDomainType>();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title><Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title>
	</Card.Header>
	<Card.Content class="space-y-2">
		<span class="flex w-full justify-between">
			<Tabs.Root bind:value={ctx.active} orientation="horizontal">
				<Tabs.List class="overflow-x-auto">
					{#if show}
						<Tabs.Trigger value="settings"><SettingsIcon class="size-4" /></Tabs.Trigger>
					{/if}
					{#each ctx.rangeIds as value, i (i)}
						<Tabs.Trigger {value}>
							{value}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>
			</Tabs.Root>
			<Tabs.Root bind:value={view}>
				<Tabs.List>
					<Tabs.Trigger value="chart" disabled={ctx.active === 'settings'}
						><ChartColumnIcon /></Tabs.Trigger
					>
					<Tabs.Trigger value="table" disabled={ctx.active === 'settings'}
						><TableIcon /></Tabs.Trigger
					>
				</Tabs.List>
			</Tabs.Root>
		</span>
		<Tabs.Root bind:value={ctx.active} orientation="horizontal">
			{#if show}
				<Tabs.Content value="settings">
					<!-- Expand by default if only one value is present -->
					<Accordion.Root type="multiple" value={[]}>
						<Accordion.Item value="parameter-groups">
							<Accordion.Trigger>Parameter Groups</Accordion.Trigger>
							<Accordion.Content>
								{#each coverage.parameterGroups as data, i (i)}
									<ParameterGroup bind:selected {data} />
								{/each}
							</Accordion.Content>
						</Accordion.Item>
						<Accordion.Item value="parameters" class="border-b last:border-b-0">
							<Accordion.Trigger value="parameters">Parameters</Accordion.Trigger>
							<Accordion.Content
								>{#each coverage.rangeIds as key (key)}
									{@const data = coverage.parameters.get(key)}
									{#if data}
										<ParameterCpt
											{data}
											stats={ctx.stats.get(key)}
											colors={colors[key]}
											checked={ctx.selected.has(key)}
											onCheckedChange={ctx.updateParamCheck(key)}
										/>
									{:else}
										<Item.Root variant="outline" class="w-full">
											<Item.Content>
												<Item.Title>{key}</Item.Title>
												<Item.Description>No Parameter Object Found</Item.Description>
											</Item.Content>
											<Item.Actions>
												<Checkbox
													checked={ctx.selected.has(key)}
													onCheckedChange={ctx.updateParamCheck(key)}
												/>
											</Item.Actions>
										</Item.Root>
									{/if}
								{/each}
							</Accordion.Content>
						</Accordion.Item>
						<Accordion.Item value="axes-config" class="border-b last:border-b-0">
							<Accordion.Trigger>Axes Configuration</Accordion.Trigger>
							<Accordion.Content>
								<AxisConfigurer />
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				</Tabs.Content>
			{/if}
			{#each ctx.rangeIds as key (key)}
				<Tabs.Content value={key}>
					<DataView
						bind:view
						parameter={coverage.parameters.get(key) || key}
						{colors}
						bind:xDomain
					/>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
</Card.Root>
