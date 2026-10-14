<script lang="ts" module>
	import { type DataRow, Range, Parameter, CustomDate, isUndefined } from '#lib/core/index.ts';
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
		Move3DIcon
	} from '@lucide/svelte';
	import dimensions from './axes-utils.ts';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import ParameterGroup from '../metadata/parameter-group-cpt.svelte';
	import type { Axis, AxisIndexValue, AxisResolver, CoverageProps } from './types';
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

	const axisResolver: AxisResolver = (axisName, idx, mode) => {
		let value: string | number | undefined;

		switch (coverage.domain.domainType) {
			case 'Grid':
			case 'Point':
			case 'PointSeries':
			case 'VerticalProfile':
				if (axisName === 'x' || axisName === 'y' || axisName === 'z')
					value = coverage.domain.axes[axisName]?.values[idx] || idx;
				break;
			case 'Trajectory':
			case 'Section':

			case 'MultiPoint':
			case 'MultiPointSeries':
				if (axisName === 'composite')
					value = `(${coverage.domain.axes.composite.values[idx].join(',')})`;
				break;
			default:
				value = `polygon @ index ${idx}`;
		}
		if (axisName === 't') {
			value = coverage.t[idx];
			if (mode === 'chart') return new CustomDate(value);
		}
		if (isUndefined(value)) return `val @ index: ${idx}`;
		return value;
	};

	let axesConfig = $state(
		new SvelteMap(
			dimensions(coverage.domain)
				.entries()
				.filter(([an]) => an === 'x')
		)
	);
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
			.then((rows) => {
				data = rows;
			});
	}

	let axes = $derived(coverage.axesSize.entries().toArray() as [Axis, number][]);
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
			</Tabs.Root>
			<Tabs.Root bind:value={tabValue}>
				<Tabs.List>
					<Tabs.Trigger value="chart" disabled={['parameter-groups', 'axes'].includes(activeParam)}
						><ChartColumnIcon /></Tabs.Trigger
					>
					<Tabs.Trigger value="table" disabled={['parameter-groups', 'axes'].includes(activeParam)}
						><TableIcon /></Tabs.Trigger
					>
					{#if show}
						<Tabs.Trigger
							value="param-info"
							disabled={['parameter-groups', 'axes'].includes(activeParam)}
							><VariableIcon /></Tabs.Trigger
						>
					{/if}
					<Tabs.Trigger
						value="download"
						disabled={['parameter-groups', 'axes'].includes(activeParam)}
						><DownloadIcon /></Tabs.Trigger
					>
				</Tabs.List>
			</Tabs.Root>
		</span>
		<Tabs.Root bind:value={activeParam} orientation="horizontal">
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
