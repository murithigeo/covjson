<script lang="ts" module>
	import { type DataRow, Range } from '#lib/core/index.ts';
	import DataView from './data-view.svelte';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import AxisConfigurer from './axis-config.svelte';
	import {
		TrashIcon,
		PinIcon,
		PinOffIcon,
		ChartColumnIcon,
		TableIcon,
		DownloadIcon,
		SettingsIcon
	} from '@lucide/svelte';
	import dimensions from './axes-utils.ts';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import * as Card from '#lib/components/ui/card/index.ts';
	import * as Tabs from '#lib/components/ui/tabs/index.ts';
	import ParameterGroup from '../metadata/parameter-group-cpt.svelte';
	import type { ChartDimensions, Axis, CoverageProps } from './types.d.ts';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { type AxisNamesOptions, type QueryOptions } from '#lib/core/index.ts';
	import * as Accordion from '#lib/components/ui/accordion/index.ts';
	import ParameterCpt from '../metadata/parameter-cpt.svelte';
	import * as Item from '#lib/components/ui/item/index.ts';
	import ColorPicker from '#lib/ui/metadata/parameter/color-picker.svelte';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import { getRandomColor } from '#lib/utils.ts';
	import Tooltip from './tooltip.svelte';
</script>

<script lang="ts">
	let {
		actions,
		data: cov = $bindable(),
		onIndicesChange = $bindable(),
		show,
		selected = $bindable(new SvelteSet([...cov.ranges.keys(), ...cov._ranges.keys()])),
		pinned = $bindable(),
		color = $bindable(
			[...cov.ranges.keys(), ...cov._ranges.keys()].reduce(
				(l, r) => ({ ...l, [r]: { default: getRandomColor() } }),
				{}
			)
		),
		indices = $bindable(cov.indices),
		onTrashCoverage
	}: CoverageProps = $props();

	const coverage = cov.denormalize();

	const { x: initialX, resolver: axisResolver } = dimensions(coverage.domain);
	let stats = new SvelteMap<string, Range>();

	// svelte-ignore non_reactive_update
	let axesConfig = new SvelteMap<ChartDimensions, Axis>([['x', initialX]]);

	let parameterKeys = $derived(
		new Set([...selected, ...coverage.ranges.keys(), ...coverage._ranges.keys()])
	);
	let activeParam = $state(selected.size ? [...selected][0] : 'configurator');

	let data = $state<DataRow[]>([]);
	function dataFetcher(selected: QueryOptions['ranges'], axisNames: QueryOptions['axisNames']) {
		// Allow user to specify custom indices for custom values
		coverage
			.query(indices, {
				axisNames,
				cb(name, range) {
					stats.set(name, range);
				},
				ranges: selected
			})
			.then((rows) => (data = rows));
	}

	let axes = $derived(coverage.axesSize.entries().toArray() as [Axis, number][]);
	// svelte-ignore non_reactive_update
	let axisNames = new SvelteMap<string, AxisNamesOptions>([[initialX, true]]);
	$effect(() => dataFetcher([...selected], Object.fromEntries(axisNames)));

	let tabValue = $state<'table' | 'chart' | 'download'>('chart');
	/**
	 * If facetAll, display all values, else display for current value
	 */
	let tooltip = $state<DataRow | null>(null);
	$effect(() => {
		if (!tooltip) return;
		const indices = coverage.axesSize
			.entries()
			.map(([k]): [Axis, number] => [k as Axis, tooltip![k] as number]);
		onIndicesChange?.(coverage, new Map(indices));
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title><Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title>

		<Card.Action>
			<ButtonGroup.Root>
				{#if actions?.pinnable}
					<Button size="icon-sm" variant="outline" onclick={() => (pinned = !pinned)}
						>{#if pinned}
							<PinOffIcon />{:else}<PinIcon />
						{/if}</Button
					>
				{/if}

				{#if actions?.trashable}
					<Button size="icon-sm" variant="outline" onclick={() => onTrashCoverage?.(cov)}
						><TrashIcon /></Button
					>
				{/if}
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content class="space-y-2">
		<span class="flex w-full justify-between">
			<Tabs.Root bind:value={activeParam} orientation="horizontal">
				<Tabs.List class="overflow-x-auto">
					<Tabs.Trigger value="configurator"><SettingsIcon class="size-4" /></Tabs.Trigger>
					{#each parameterKeys as value, i (i)}
						<Tabs.Trigger {value}>
							{value}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>
			</Tabs.Root>
			<Tabs.Root bind:value={tabValue}>
				<Tabs.List>
					<Tabs.Trigger value="chart" disabled={activeParam === 'configurator'}
						><ChartColumnIcon /></Tabs.Trigger
					>
					<Tabs.Trigger value="table" disabled={activeParam === 'configurator'}
						><TableIcon /></Tabs.Trigger
					>

					<Tabs.Trigger value="download" disabled={activeParam === 'configurator'}
						><DownloadIcon /></Tabs.Trigger
					>
				</Tabs.List>
			</Tabs.Root>
		</span>
		<Tabs.Root bind:value={activeParam} orientation="horizontal">
			<Tabs.Content value="configurator">
				<Accordion.Root type="multiple" value={[]}>
					<Accordion.Item value="parameter-groups">
						<Accordion.Trigger>Parameter Groups</Accordion.Trigger>
						<Accordion.Content>
							{#each coverage.parameterGroups as pGroup, i (i)}
								<ParameterGroup bind:selected data={pGroup} />
							{/each}
						</Accordion.Content>
					</Accordion.Item>
					<Accordion.Item value="parameters" class="border-b last:border-b-0">
						<Accordion.Trigger value="parameters">Parameters</Accordion.Trigger>
						<Accordion.Content
							>{#each parameterKeys as key (key)}
								{@const data = coverage.parameters.get(key)}
								{#if data}
									<ParameterCpt
										{data}
										{key}
										checkable
										bind:color={
											() => color[key]?.default || '#555',
											(v) => (v ? (color[key].default = v) : undefined)
										}
										bind:checked={
											() => selected.has(key), (b) => (b ? selected.add(key) : selected.delete(key))
										}
										stats={stats.get(key)}
									/>
								{:else}
									<Item.Root variant="outline" class="w-full">
										<Item.Content>
											<Item.Title>{key}</Item.Title>
											<Item.Description>No Parameter Object Found</Item.Description>
										</Item.Content>
										<Item.Actions>
											<ColorPicker
												bind:hex={
													() => color[key].default,
													(v) => (v ? (color[key].default = v) : undefined)
												}
											/>
											<Checkbox
												bind:checked={
													() => selected.has(key),
													(b) => (b ? selected.add(key) : selected.delete(key))
												}
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
							<AxisConfigurer bind:config={axesConfig} {axes} {axisResolver} bind:axisNames />
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			</Tabs.Content>

			{#each parameterKeys as key (key)}
				<Tabs.Content value={key}>
					<DataView
						bind:data
						bind:tabValue
						bind:tooltip
						{show}
						range={coverage.ranges.get(key)!}
						parameter={coverage.parameters.get(key) || key}
						covId={coverage.id || cov.uuid}
						{axisResolver}
						{axes}
						bind:axesConfig
						color={color[key]}
					/>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
	<Card.Footer class="flex flex-col items-center">
		<Tooltip {axesConfig} {tooltip} {data} />
	</Card.Footer>
</Card.Root>
