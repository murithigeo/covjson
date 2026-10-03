<script lang="ts" module>
	import * as Chart from '$lib/components/ui/chart/index.js';
	import {
		Coverage,
		type OnIndicesChange,
		isUndefined,
		isNull,
		CustomDate,
		type DataRow
	} from '@murithigeo/covjson-core';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import ParameterRender from './param-render.svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import {
		TrashIcon,
		PinIcon,
		HardDriveDownloadIcon,
		PinOffIcon,
		DownloadIcon,
		ChevronDownIcon
	} from '@lucide/svelte';

	import dimensions, { type Axis, type AxisConfig } from './dimensions.ts';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { SvelteMap } from 'svelte/reactivity';
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
		range.options = {
			...range.options,
			onNonCacheFetch(value) {
				range.options.onNonCacheFetch?.(value);
				ctx.updateRangeData(key, coverage.uuid, range);
			}
		};
		coverage.ranges.set(key, range);
	}

	/**
	 * @todo Allow incremental updates by not rerendering entire card. i.e if coverage here, only update coverage indices
	 */
	const domain = coverage.domain.clone()?.denormalize();

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
	let dataPromise = $derived.by(() => {
		const preloadAxis = [...new Set([fx, fy, x, y1])].filter((v) => !isUndefined(v));
		coverage.query(coverage.indices, selected, preloadAxis).then((rows) => setData(rows));
	});

	$effect(() => {
		dataPromise;
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title><Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title>
		<Card.Description class="flex space-x-2">
			<div class="flex items-center space-x-2">
				<Switch
					checked={fx === ds.fx}
					disabled={!ds.fx}
					onCheckedChange={(checked) => {
						if (checked) fx = ds.fx;
						else fx = undefined;
					}}
				/>
				<Label>{ds.fx}</Label>
			</div>
			<Separator orientation="vertical" />
			<div class="flex items-center space-x-2">
				<Switch
					checked={fy === ds.fy}
					disabled={!ds.fy}
					onCheckedChange={(checked) => {
						if (checked) fy = ds.fy;
						else fy = undefined;
					}}
				/>
				<Label>{ds.fy}</Label>
			</div>
			<Separator orientation="vertical" />
			<!-- Make dropdown or find a way to render the splines
			<div class="flex items-center space-x-2">
				<Switch
					checked={y1 === ds.y1}
					disabled={!ds.y1}
					onCheckedChange={(checked) => {
						if (checked) y1 = ds.y1;
						else y1 = undefined;
					}}
				/>
				<Label>{ds.y1}</Label>
			</div> -->
			<Separator orientation="vertical" />

			<div class="flex items-center space-x-2">
				<Switch bind:checked={facetAll} />
				<Label>facetAll</Label>
			</div>
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
		<Tabs.Root value={'STRINGBS'}>
			<Tabs.List>
				{#each parameters as [value], i (i)}
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
						{domain}
					/>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
</Card.Root>
