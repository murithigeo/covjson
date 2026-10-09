<script lang="ts" module>
	import { isUndefined, type DataRow, Range, Parameter } from '#lib/core/index.ts';
	import ParameterRender from './data-view.svelte';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
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
		CircleAlertIcon
	} from '@lucide/svelte';
	import dimensions from './axes-utils.ts';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import ParameterGroup from '../metadata/parameter-group-cpt.svelte';
	import * as Empty from '#lib/components/ui/empty/index.ts';
	import type { Axis, AxisConfig, AxisResolver, CoverageProps } from './types';
	import { SvelteSet } from 'svelte/reactivity';
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

	let stats = $state<Record<string, Range>>({});

	const coverage = cov.denormalize();

	const axisResolver: AxisResolver = (axisName, idx) => {
		if (axisName === 'z' || axisName === 't') return coverage.domain[axisName][idx];
		//@ts-expect-error type mismatch
		return coverage.domain.axes[axisName]?.values[idx];
	};
	for (const [key, range] of coverage.ranges) {
		if (range.type === 'NdArray') {
			stats[key] = range;
		}
		const oldCb = range.options.onNonCacheFetch;
		range.options = {
			...range.options,
			onNonCacheFetch(value) {
				oldCb?.(value);
				stats[key] = value;
			}
		};
		cov.ranges.set(key, range);
	}

	/**
	 * @todo Allow incremental updates by not rerendering entire card. i.e if coverage here, only update coverage indices
	 */

	const ds = $derived(dimensions(coverage.domain));
	let x = $derived(ds.x);
	let fx = $state<AxisConfig['fx']>();
	let fy = $state<AxisConfig['fy']>();
	let y1 = $state<AxisConfig['y1']>();
	let facetAll = $state(false);
	let parameters = $derived.by<[string, Parameter][]>(() =>
		coverage.parameters.entries().toArray()
	);

	let activeParam = $state([...coverage.ranges.keys()][0]);

	let data = $state<DataRow[]>([]);

	function dataFetcher(selected: string[], axisNames: string[]): void {
		coverage.query(coverage.indices, selected, axisNames).then((rows) => (data = rows));
	}

	let axes = $derived([...coverage.axesSize.entries().map(([k, v]): [Axis, number] => [k, v])]);
	let preloadAxes = $derived(new Set([x, fx, fy, y1].filter((v) => !isUndefined(v))));
	$effect(() => dataFetcher([...selected], [...preloadAxes]));
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
			<ToggleGroup.Root
				type="multiple"
				variant="outline"
				onValueChange={(list) => {
					fx = list.includes('fx') ? ds.fx : undefined;
					fy = list.includes('fy') ? ds.fy : undefined;
					y1 = list.includes('y1') ? ds.y1 : undefined;
					facetAll = list.includes('facetAll');
				}}
			>
				{#each Object.entries(ds).filter(([k, v]) => !isUndefined(v) && k !== 'x') as [k] (k)}
					<ToggleGroup.Item value={k}
						>{#if k === 'fx'}
							<LayoutArrowRightIcon />
						{:else if k === 'fy'}
							<LayoutArrowDownIcon />
						{:else}
							<ChartLineIcon />
						{/if}
					</ToggleGroup.Item>
				{/each}
				<ToggleGroup.Item value="facetAll"><ListChecksIcon /></ToggleGroup.Item>
			</ToggleGroup.Root>
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

			{#each parameters as [key, parameter], i (i)}
				<Tabs.Content value={key}>
					{#if selected.has(key)}
						<ParameterRender
							bind:data
							bind:x
							bind:fx
							bind:y1
							bind:fy
							bind:facetAll
							bind:tabValue
							bind:tooltip
							{show}
							range={stats[key]}
							{parameter}
							covId={coverage.id || cov.uuid}
							{axisResolver}
							{axes}
						/>
					{:else}
						<Empty.Root>
							<Empty.Header>
								<Empty.Media><CircleAlertIcon /></Empty.Media>
								<Empty.Title>Parameter Not Selected</Empty.Title>
								<Empty.Description>Data for this parameter has not been loaded</Empty.Description>
								<Empty.Content>
									<Button onclick={() => selected.add(key)}>Select</Button>
								</Empty.Content>
							</Empty.Header>
						</Empty.Root>
					{/if}
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
</Card.Root>
