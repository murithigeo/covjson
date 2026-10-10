<script lang="ts" module>
	import { isUndefined, type DataRow, Range, Parameter } from '#lib/core/index.ts';
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
		VariableIcon,
		DownloadIcon,
		BoxesIcon,
		LayoutArrowRightIcon,
		LayoutArrowDownIcon,
		ChartLineIcon,
		ListChecksIcon,
		CircleAlertIcon,
		Move3DIcon
	} from '@lucide/svelte';
	import dimensions from './axes-utils.ts';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import ParameterGroup from '../metadata/parameter-group-cpt.svelte';
	import type { Axis, AxisConfig, AxisResolver, CoverageProps, DataViewProps } from './types';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { type AxisNamesOptions, type QueryOptions } from '#lib/core/types.js';
</script>

<script lang="ts">
	let {
		actions,
		data: cov = $bindable(),
		onIndicesChange = $bindable(),
		show,
		selected = $bindable(new SvelteSet(cov.ranges.keys())),
		pinned = $bindable(),
		onTrashCoverage
	}: CoverageProps = $props();

	const coverage = cov.denormalize();

	let stats = $state(new SvelteMap<string, string | Range>());

	const axisResolver: AxisResolver = (axisName, idx) => {
		if (axisName === 'z' || axisName === 't') return coverage.domain[axisName][idx];
		//@ts-expect-error type mismatch
		return coverage.domain.axes[axisName]?.values[idx];
	};

	/**
	 * @todo Allow incremental updates by not rerendering entire card. i.e if coverage here, only update coverage indices
	 */

	let axesConfig = $state(new SvelteMap(dimensions(coverage.domain)));
	let facetAll = $state(false);
	let parameters = $derived<[string, Parameter][]>(coverage.parameters.entries().toArray());
	let activeParam = $state(parameters[0][0]);

	let data = $state<DataRow[]>([]);

	function dataFetcher(
		selected: QueryOptions['ranges'],
		axisNames: QueryOptions['axisNames']
	): void {
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

	let axes = $derived([
		...coverage.axesSize.entries().map(([k, v]): [Axis, number] => [k as Axis, v])
	]);
	let axisNames = $state(new SvelteMap<string, AxisNamesOptions>());

	$effect(() => dataFetcher([...selected], Object.fromEntries(axisNames)));

	let tabValue = $state<'table' | 'chart' | 'param-info' | 'download'>('chart');
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
		<Card.Description class="flex flex-row items-center space-x-2">
			<Tabs.Root bind:value={tabValue}>
				<Tabs.List>
					<Tabs.Trigger value="chart" disabled={activeParam === 'parameter-groups'}
						><ChartColumnIcon /></Tabs.Trigger
					>
					<Tabs.Trigger value="table" disabled={activeParam === 'parameter-groups'}
						><TableIcon /></Tabs.Trigger
					>
					{#if show}
						<Tabs.Trigger value="param-info" disabled={activeParam === 'parameter-groups'}
							><VariableIcon /></Tabs.Trigger
						>
					{/if}
					<Tabs.Trigger value="download" disabled={activeParam === 'parameter-groups'}
						><DownloadIcon /></Tabs.Trigger
					>
				</Tabs.List>
			</Tabs.Root>
		</Card.Description>
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
	<Card.Content>
		<Tabs.Root bind:value={activeParam} orientation="horizontal">
			<Tabs.List class="overflow-x-auto">
				<Tabs.Trigger value="parameter-groups" disabled={!coverage.parameterGroups.length}
					><BoxesIcon class="size-4" /></Tabs.Trigger
				>
				<Tabs.Trigger value="axes"><Move3DIcon class="size-4" /></Tabs.Trigger>
				{#each new Set([...selected, ...parameters.map(([k]) => k)]) as value, i (i)}
					<Tabs.Trigger {value}>
						{value}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
			{#if show?.parameterGroups}
				<Tabs.Content value="parameter-groups">
					<div class="flex space-y-2">
						{#each coverage.parameterGroups as pGroup, i (i)}
							<ParameterGroup bind:selected data={pGroup} />
						{/each}
					</div>
				</Tabs.Content>
			{/if}
			<Tabs.Content value="axes">
				<AxisConfigurer bind:config={axesConfig} {axes} {axisResolver} />
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
					/>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
</Card.Root>
