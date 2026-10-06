<script lang="ts" module>
	import {
		Coverage,
		type OnIndicesChange,
		isUndefined,
		type DataRow,
		type RangeStatistics,
		Range,
		Parameter
	} from '#lib/core/index.ts';
	import ParameterRender from './data-view.svelte';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import {
		TrashIcon,
		PinIcon,
		PinOffIcon,
		ChartColumnIcon,
		TableIcon,
		VariableIcon
	} from '@lucide/svelte';
	import dimensions, { type Axis, type AxisConfig } from './axes-utils.ts';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { ReactiveParameter } from '#lib/ui/dashboards/utils/parameter.svelte.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import type { OnChangeFn } from '../metadata/types';
</script>

<script lang="ts">
	interface Props {
		coverage: Coverage;
		onIndicesChange?: OnIndicesChange;
		renderParameter?: boolean;
		selected?: Set<string>;
		pinned?: boolean;
		onTrashCoverage?: (coverage: Coverage) => void;
	}

	let {
		coverage: cov = $bindable(),
		onIndicesChange = $bindable(),
		renderParameter = $bindable(true),
		selected = $bindable(new Set(cov.ranges.keys())),
		pinned = $bindable(),
		onTrashCoverage
	}: Props = $props();

	let stats = $state<Record<string, Range>>({});

	const coverage = cov.denormalize();

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
	let x = $state(ds.x);
	let fx = $state<AxisConfig['fx']>();
	let fy = $state<AxisConfig['fy']>();
	let y1 = $state<AxisConfig['y1']>();
	let facetAll = $state(false);

	let parameters = $derived.by<[string, Parameter][]>(() =>
		coverage.parameters.entries().toArray()
	);

	let data = $state<DataRow[]>([]);

	const setData = (rows: DataRow[]) => (data = rows);
	let dataPromise = $derived.by(async () => {
		const preloadAxis = [...new Set([fx, fy, x, y1])].filter((v) => !isUndefined(v));
		const rows = await coverage.query(coverage.indices, [...selected], preloadAxis);
		return setData(rows);
	});

	$effect(() => {
		dataPromise;
	});
	let tabValue = $state<'table' | 'chart' | 'param-info'>('chart');
	/**
	 * If facetAll, display all values, else display for current value
	 */
	let tooltip = $state<DataRow | null>(null);
	$effect(() => {
		if (!tooltip) return;
		const indices = coverage.axesSize
			.entries()
			.map(([k]): [Axis, number] => [k, tooltip![k] as number]);
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
				{#each Object.entries(ds).filter(([k, v]) => !isUndefined(v) && k !== 'x') as [k, v]}
					<ToggleGroup.Item value={k}>{v}</ToggleGroup.Item>
				{/each}
				<ToggleGroup.Item value="facetAll">Facet All</ToggleGroup.Item>
			</ToggleGroup.Root>
			<Tabs.Root bind:value={tabValue}>
				<Tabs.List>
					<Tabs.Trigger value="chart"><ChartColumnIcon /></Tabs.Trigger>
					<Tabs.Trigger value="table"><TableIcon /></Tabs.Trigger>
					{#if renderParameter}
						<Tabs.Trigger value="param-info"><VariableIcon /></Tabs.Trigger>
					{/if}
				</Tabs.List>
			</Tabs.Root>
		</Card.Description>
		<Card.Action>
			<ButtonGroup.Root>
				<Button size="icon-sm" variant="outline" onclick={() => (pinned = !pinned)}
					>{#if pinned}
						<PinOffIcon />{:else}<PinIcon />
					{/if}</Button
				>
				<Button size="icon-sm" variant="outline" onclick={() => onTrashCoverage?.(cov)}
					><TrashIcon /></Button
				>
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Tabs.Root value={[...selected][0]} orientation="vertical">
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
						bind:facetAll
						bind:tabValue
						bind:tooltip
						{parameter}
						range={stats[key]}
						{coverage}
					/>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
</Card.Root>
