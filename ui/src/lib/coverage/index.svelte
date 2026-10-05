<script lang="ts" module>
	import {
		Coverage,
		type OnIndicesChange,
		isUndefined,
		type DataRow
	} from '@murithigeo/covjson-core';
	import ParameterRender from './param-render.svelte';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { TrashIcon, PinIcon, PinOffIcon, ChartColumnIcon, TableIcon } from '@lucide/svelte';
	import dimensions, { type AxisConfig } from './dimensions.ts';
	import { getDashCtx } from '#lib/dashboards/utils/ctx.svelte.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { ReactiveParameter } from '#lib/dashboards/utils/parameter.svelte.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { SvelteMap } from 'svelte/reactivity';
	import { Separator } from '#lib/components/ui/separator/index.ts';
</script>

<script lang="ts">
	interface Props {
		coverage: Coverage;
		onIndicesChange?: OnIndicesChange;
	}

	let { coverage = $bindable(), onIndicesChange = $bindable() }: Props = $props();
	const ctx = getDashCtx();

	for (const [key, range] of coverage.ranges) {
		if (!ctx.parameters.has(key) && coverage.parameters.has(key)) {
			ctx.setParameter(key, coverage.parameters.get(key)!);
		}
		if (range.type === 'NdArray') {
			ctx.updateRangeData(key, coverage.uuid, range);
		}
		const oldCb = range.options.onNonCacheFetch;
		range.options = {
			...range.options,
			onNonCacheFetch(value) {
				oldCb?.(value);
				ctx.updateRangeData(key, coverage.uuid, range);
			}
		};
		coverage.ranges.set(key, range);
	}

	/**
	 * @todo Allow incremental updates by not rerendering entire card. i.e if coverage here, only update coverage indices
	 */
	const domain = coverage.denormalize().domain;

	const ds = dimensions(domain);
	let x = $state(ds.x);
	let fx = $state<AxisConfig['fx']>();
	let fy = $state<AxisConfig['fy']>();
	let y1 = $state<AxisConfig['y1']>();
	let facetAll = $state(false);

	let parameters = $derived.by<[string, ReactiveParameter][]>(() =>
		ctx.parameters
			.entries()
			.filter(([key]) => coverage.ranges.has(key))
			.toArray()
	);

	let selected = $derived(parameters.filter(([key]) => ctx.selected.has(key)).map(([key]) => key));

	let data = $state<DataRow[]>([]);

	const setData = (rows: DataRow[]) => (data = rows);
	let dataPromise = $derived.by(async () => {
		const preloadAxis = [...new Set([fx, fy, x, y1])].filter((v) => !isUndefined(v));
		const rows = await coverage.query(coverage.indices, selected, preloadAxis);
		return setData(rows);
	});

	$effect(() => {
		dataPromise;
	});
	let tabValue = $derived<'table' | 'chart'>('chart');
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
				{#each Object.entries(ds).filter(([k, v]) => !isUndefined(v) && k !== 'x') as [k, v]}
					<ToggleGroup.Item value={k}>{v}</ToggleGroup.Item>
				{/each}
				<ToggleGroup.Item value="facetAll">Facet All</ToggleGroup.Item>
			</ToggleGroup.Root>
			<Tabs.Root bind:value={tabValue}>
				<Tabs.List>
					<Tabs.Trigger value="chart"><ChartColumnIcon /></Tabs.Trigger>
					<Tabs.Trigger value="table"><TableIcon /></Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		</Card.Description>
		<Card.Action>
			<ButtonGroup.Root>
				<Button
					size="icon-sm"
					variant="outline"
					onclick={() => ctx.updateCoveragePinStatus(coverage)}
					>{#if ctx.pinned.has(coverage.uuid)}
						<PinOffIcon />{:else}<PinIcon />
					{/if}</Button
				>
				<Button
					size="icon-sm"
					variant="outline"
					onclick={() => ctx.trashCoverage(coverage)}
					disabled={ctx.pinned.has(coverage.uuid)}><TrashIcon /></Button
				>
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Tabs.Root value={selected[0]} orientation="vertical">
			<Tabs.List class="h-full overflow-y-auto">
				{#each new Set([...selected, ...parameters.map(([k]) => k)]) as value, i (i)}
					<Tabs.Trigger {value}>{value}</Tabs.Trigger>
				{/each}
			</Tabs.List>
			{#each parameters as [key, parameter], i (i)}
				<Tabs.Content value={key}>
					<ParameterRender
						bind:data
						bind:x
						bind:fx
						bind:y1
						bind:fy
						bind:coverage
						{parameter}
						bind:facetAll
						bind:tabValue
						{domain}
					/>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
</Card.Root>
