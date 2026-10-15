<script lang="ts" module>
	import { type DataRow, Range, Parameter } from '#lib/core/index.ts';
	import ParameterRender from './data-view.svelte';
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
		BoxesIcon,
		Move3DIcon
	} from '@lucide/svelte';
	import dimensions from './axes-utils.ts';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import ParameterGroup from '../metadata/parameter-group-cpt.svelte';
	import type { ChartDimensions, Axis, CoverageProps } from './types';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { type AxisNamesOptions, type QueryOptions } from '#lib/core/types.js';
	import * as Accordion from '#lib/components/ui/accordion/index.ts';
	import ParameterCpt from '../metadata/parameter-cpt.svelte';
</script>

<script lang="ts">
	let {
		actions,
		data: cov = $bindable(),
		onIndicesChange = $bindable(),
		show,
		selected = $bindable(new SvelteSet([...cov.ranges.keys(), ...cov._ranges.keys()])),
		pinned = $bindable(),
		onTrashCoverage
	}: CoverageProps = $props();

	const coverage = cov.denormalize();

	const { x: initialX, resolver: axisResolver } = dimensions(coverage.domain);
	let stats = $state(new SvelteMap<string, string | Range>());

	let axesConfig = $state(new SvelteMap<ChartDimensions, Axis>([['x', initialX]]));
	let facetAll = $state(false);
	let parameters = $derived<[string, Parameter][]>(coverage.parameters.entries().toArray());

	// svelte-ignore state_referenced_locally
	let activeParam = $state(parameters[0][0]);

	let data = $state<DataRow[]>([]);
	function dataFetcher(selected: QueryOptions['ranges'], axisNames: QueryOptions['axisNames']) {
		// Allow user to specify custom indices for custom values
		coverage
			.query(coverage.indices, {
				axisNames,
				cb(name, range) {
					stats.set(name, range);
				},
				ranges: selected
			})
			.then((rows) => (data = rows));
	}

	let axes = $derived(coverage.axesSize.entries().toArray() as [Axis, number][]);
	let axisNames = $state(new SvelteMap<string, AxisNamesOptions>([[initialX, true]]));
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

<Card.Root class="h-full">
	<Card.Header>
		<Card.Title><Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title>

		{#if actions}
			<Card.Action>
				<ButtonGroup.Root>
					{#if actions.pinnable}
						<Button size="icon-sm" variant="outline" onclick={() => (pinned = !pinned)}
							>{#if pinned}
								<PinOffIcon />{:else}<PinIcon />
							{/if}</Button
						>
					{/if}

					{#if actions.trashable}
						<Button size="icon-sm" variant="outline" onclick={() => onTrashCoverage?.(cov)}
							><TrashIcon /></Button
						>
					{/if}
				</ButtonGroup.Root>
			</Card.Action>
		{/if}
	</Card.Header>
	<Card.Content class="space-y-2">
		<span class="flex w-full justify-between">
			<Tabs.Root bind:value={activeParam} orientation="horizontal">
				<Tabs.List class="overflow-x-auto">
					<Tabs.Trigger value="parameter-info"><BoxesIcon class="size-4" /></Tabs.Trigger>
					<Tabs.Trigger value="axes"><Move3DIcon class="size-4" /></Tabs.Trigger>
					{#each new Set([...selected, ...parameters.map(([k]) => k)]) as value, i (i)}
						<Tabs.Trigger {value}>
							{value}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>
			</Tabs.Root>
			<Tabs.Root bind:value={tabValue}>
				<Tabs.List>
					<Tabs.Trigger value="chart" disabled={['parameter-info', 'axes'].includes(activeParam)}
						><ChartColumnIcon /></Tabs.Trigger
					>
					<Tabs.Trigger value="table" disabled={['parameter-info', 'axes'].includes(activeParam)}
						><TableIcon /></Tabs.Trigger
					>

					<Tabs.Trigger value="download" disabled={['parameter-info', 'axes'].includes(activeParam)}
						><DownloadIcon /></Tabs.Trigger
					>
				</Tabs.List>
			</Tabs.Root>
		</span>
		<Tabs.Root bind:value={activeParam} orientation="horizontal">
			<Tabs.Content value="parameter-info">
				<Accordion.Root type="multiple" value={['parameter-groups', 'parameters']}>
					<Accordion.Item value="parameter-groups">
						<Accordion.Trigger>Parameter Groups</Accordion.Trigger>
						<Accordion.Content>
							{#each coverage.parameterGroups as pGroup, i (i)}
								<ParameterGroup bind:selected data={pGroup} />
							{/each}
						</Accordion.Content>
					</Accordion.Item>
					<Accordion.Item value="parameters">
						<Accordion.Trigger value="parameters">Parameters</Accordion.Trigger>
						<Accordion.Content
							>{#each parameters as [key, param] (key)}
								<ParameterCpt
									data={param}
									checkable
									bind:checked={
										() => selected.has(key),
										(checked) => {
											if (checked) selected.add(key);
											else selected.delete(key);
										}
									}
								/>
							{/each}</Accordion.Content
						>
					</Accordion.Item>
				</Accordion.Root>
			</Tabs.Content>
			<Tabs.Content value="axes">
				<AxisConfigurer bind:config={axesConfig} {axes} {axisResolver} bind:axisNames />
			</Tabs.Content>

			{#each parameters as [key, parameter], i (i)}
				<Tabs.Content value={key}>
					<ParameterRender
						bind:data
						bind:facetAll
						bind:tabValue
						bind:tooltip
						{show}
						range={coverage.ranges.get(key)!}
						{parameter}
						covId={coverage.id || cov.uuid}
						{axisResolver}
						{axes}
						bind:axesConfig
					/>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
</Card.Root>
