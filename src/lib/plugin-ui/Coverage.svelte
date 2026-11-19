<svelte:options customElement={{ tag: 'covjson-coverage', shadow: 'none' }} />

<script lang="ts" generics="D extends Domain=Domain">
	import DataView from './coverage/data-view.svelte';
	import { ChartColumnIcon, TableIcon, VariableIcon } from '@lucide/svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import type {
		Tooltip,
		Colors,
		CoverageOptions,
		View,
		Data,
		Axis,
		RangeStatistics
	} from './types';
	import { ChartGroup } from 'layerchart';
	import {
		axisIdxResolver,
		calculateMedian,
		getAxisConfig,
		getRandomColor
	} from './coverage/utils.svelte';
	import {
		isNull,
		isUndefined,
		minMax,
		type Range,
		type Coverage,
		type Indices
	} from '#lib/core/index.js';
	import { SvelteMap } from 'svelte/reactivity';
	import type { Domain } from 'coveragejson';
	import css from '../../routes/layout.css?inline';

	/**
	 * @todo add support for string coverages
	 */
	let {
		coverage,
		selected: s,
		colors: c,
		id,
		axisNames: an,
		config: conf,
		formatters,
		labels = {}
	}: CoverageOptions<D> = $props();

	let rangeInfo = new SvelteMap<string, RangeStatistics>();

	const onIndicesChange = (indices: Exclude<Indices, number[]>) => {
		const host = $host();
		if (!host) return;
		const event = new CustomEvent<{ indices: typeof indices; coverage: Coverage<D> }>(
			'IndicesChange',
			{ detail: { indices, coverage } }
		);
		host.dispatchEvent(event);
	};

	const updateInfo = (id: string, range: Range) => {
		if (range.dataType === 'string') {
			if (!rangeInfo.has(id))
				rangeInfo.set(id, {
					'data-type': range.dataType,
					median: calculateMedian([
						...range.values
							.map((v) => (isNull(v) ? '' : v))
							.sort((a, b) => a.toString().localeCompare(b.toLocaleString()))
					]),
					totalSize: range.totalSize
				});
			return;
		}
		const stats: RangeStatistics = {
			'data-type': range.dataType,
			totalSize: range.totalSize
		};
		const values = range.values as Array<number | null>;
		[stats.min, stats.max] = minMax(values);
		stats.frequency = coverage.parameters.get(id)?.bin(values);
		console.log(stats.frequency);
		const vals = [...values].map((v) => (isNull(v) ? 0 : v)).sort((a, b) => a - b);
		stats.mean = vals.reduce((l, r) => l + r) / range.totalSize;
		stats.median = calculateMedian([...vals]);

		rangeInfo.set(id, stats);
	};
	$effect(() => {
		coverage.ranges.forEach((val, key) => {
			if (val.type === 'TiledNdArray') return; // handled by callback
			if (rangeInfo.has(key)) return; // Nothing changed so return;
			updateInfo(key, val);
		});
	});

	let defaultAxesConfig = $derived(getAxisConfig(coverage));
	let config = $derived(conf || defaultAxesConfig.config);
	let axisNames = $derived.by(() => {
		if (an) return an;
		if (!conf) return defaultAxesConfig.axisNames;
		return Object.values(conf).reduce(
			(l: NonNullable<CoverageOptions['axisNames']>, r) => ({ ...l, [r]: true }),
			{}
		);
	});
	let resolver = $derived(axisIdxResolver(coverage, formatters?.axis));
	let axesSize = $derived(coverage.axesSize as Map<Axis, number>);
	let selected = $derived(s || coverage.rangeIds);
	let rangeIds = $derived(coverage.rangeIds.filter((id) => selected.includes(id)));

	let colors = $derived.by<Colors>(() => {
		let colors: Colors = { ...(c || {}) };
		for (let rangeId of coverage.rangeIds) {
			if (colors[rangeId]) continue;
			colors[rangeId] = { default: getRandomColor() };
		}
		return colors;
	});

	let cache = $state<Data>([]);
	const updateCache = (rows: Data) => {
		for (const row of rows) {
			let idx = cache.findIndex((d) => axesSize.keys().every((k) => d[k] === (row[k] ?? 0)));
			if (idx < 0) idx = cache.length;
			const record = cache[idx] || Object.fromEntries(axesSize.keys().map((k) => [k, row[k] ?? 0]));
			for (const id of rangeIds) {
				if (!isUndefined(record[id])) continue;
				const value = row[id];
				const parameter = coverage.parameters.get(id);
				if (parameter && parameter.categoryEncoding) {
					record[id + ':cat'] = isNull(value) ? '' : (parameter.getCategory(value)?.id ?? '');
				}
				record[id] = value;
			}
			cache[idx] = record;
		}
	};
	$effect(() => {
		coverage
			.query(coverage.indices, {
				axisNames,
				ranges: rangeIds,
				cb(name, range) {
					return updateInfo(name, range);
				}
			})
			.then((rows) => updateCache(rows));
	});
	let data = $derived.by(() => {
		const ignore = Object.values(config); // index fields kept in full
		const check = axesSize
			.keys()
			.filter((an) => !ignore.includes(an))
			.toArray();
		return cache.filter((d) => check.every((an) => d[an] === (coverage.indices.get(an) ?? 0)));
	});
	let tooltip = $state<Tooltip>([]);
	$effect(() => {
		const t = tooltip.at(0);
		if (!t) return;
		const indices = axesSize.keys().map((an) => [an, t[an] ?? 0] as const);
		onIndicesChange(new Map(indices));
	});

	let view = $state<View>('chart');
	// svelte-ignore state_referenced_locally
	let active = $state<string>(rangeIds.at(0) ?? '');

	let title = $derived.by(() => {
		const { title } = labels;
		if (!title) return coverage.id || '';
		if ('value' in title) return title.value;
		const { key } = title;
		if (key in coverage) return coverage[key as keyof typeof coverage];
		return coverage.properties[key];
	});
	let description = $derived.by(() => {
		const { description } = labels;
		if (!description) return coverage.id || '';
		if ('value' in description) return description.value;
		const { key } = description;
		if (key in coverage) return coverage[key as keyof typeof coverage];
		return coverage.properties[key];
	});
</script>

<Card.Root {id}>
	<Card.Header>
		<Card.Title class="flex w-full items-center justify-between gap-3"
			>{#if title}<p>{title}</p>{/if}
			<Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title
		>
		{#if description}
			<Card.Description>{description}</Card.Description>
		{/if}
	</Card.Header>
	<Card.Content class="space-y-2">
		{#if !rangeIds.length}
			<span class="w-full content-center">Coverage has no ranges</span>
		{:else}
			<span class="flex w-full items-center justify-between gap-3">
				<Tabs.Root bind:value={active} orientation="horizontal" class="min-w-0 flex-1">
					<Tabs.List class="flex scrollbar-thin gap-2 overflow-x-auto overflow-y-hidden">
						{#each rangeIds as value, i (i)}
							<Tabs.Trigger {value} class="shrink-0 whitespace-nowrap">
								{value}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
				</Tabs.Root>

				<Tabs.Root bind:value={view} class="shrink-0">
					<Tabs.List class="flex">
						<Tabs.Trigger value="chart"><ChartColumnIcon /></Tabs.Trigger>
						<Tabs.Trigger value="table"><TableIcon /></Tabs.Trigger>
						<Tabs.Trigger value="parameter"><VariableIcon /></Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
			</span>
			<Tabs.Root bind:value={active}>
				<ChartGroup>
					{#each rangeIds as key (key)}
						<Tabs.Content value={key}>
							<DataView
								bind:view
								parameter={coverage.parameters.get(key) || key}
								{colors}
								bind:tooltip
								{resolver}
								{cache}
								{data}
								{config}
								{axisNames}
								{axesSize}
								format={(k, v) => {
									const value = formatters?.value?.(k, v);
									if (value) return value;
									return coverage.parameters.get(k)?.unit?.format(v);
								}}
								{rangeIds}
								info={rangeInfo.get(key)}
							/>
						</Tabs.Content>
					{/each}
				</ChartGroup>
			</Tabs.Root>
		{/if}
	</Card.Content>
</Card.Root>

<svelte:element this={'style'}>{css}</svelte:element>
