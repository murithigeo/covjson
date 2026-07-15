<script lang="ts">
	// tag:coverage-previewe
	import { type ChartConfig } from '../components/ui/chart/index.ts';
	import * as Card from '../components/ui/card/index.ts';
	import * as Pagination from '../components/ui/pagination/index.ts';
	import { Button } from '../components/ui/button/index.ts';
	import * as ButtonGroup from '../components/ui/button-group/index.ts';
	import { Coverage } from '@murithigeo/covjson-core';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import type { Grid } from '../../../../core/src/coveragejson.d.ts';
	import type { OnIndicesChange } from '@murithigeo/covjson-maplibre';
	import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Grip } from '@lucide/svelte';
	import { scaleBand } from 'd3-scale';
	import BarChart from './bar-chart.svelte';
	import type { SeriesDataRow } from './types.d.ts';
	import { Skeleton } from '../components/ui/skeleton/index.ts';
	import { cartesianProduct } from '@murithigeo/covjson-core';
	import { cubicInOut } from 'svelte/easing';
	interface Props {
		coverage?: Coverage;
		chartConfig: ChartConfig;
		chartType?: 'line' | 'bar';
		/**
		 * A reactive set of the current parameters selected.
		 * If undefined, defaults to all keys of the coverage's ranges
		 */
		parameters?: SvelteSet<string>;
		/**
		 * Function to execute once indices change
		 */
		onIndicesChange?: OnIndicesChange;
		/**
		 * Intended to handle the scenario where grids have more than 1 t/z values each.
		 * Sure I could create chart with the horizontal axis being t and z being vertical but what about the values?
		 * So just paginate, default is t
		 */
		pageWith?: keyof Pick<Grid['axes'], 't' | 'z'>;
	}

	let {
		coverage = $bindable(),
		chartConfig,
		chartType,
		pageWith = $bindable('t'), // Remember to reset indexof pageWith when it changes
		onIndicesChange,
		parameters = $bindable(new SvelteSet(coverage?.ranges.keys()))
	}: Props = $props();

	/**
	 * If paginated, the current page
	 */
	let page = $state(1);
	/**
	 * max iterations of the horizontal/vertical carousel
	 */
	type DMax = { axis: string; value: number };
	let axesMaxes = $state(new SvelteMap<'horizontal' | 'vertical', DMax>());
	$effect(() => {
		if (!coverage) return;
		switch (coverage.domain.domainType) {
			case 'Grid':
				axesMaxes.set('horizontal', { value: coverage.domain.x.length, axis: 'x' });
				axesMaxes.set('vertical', { value: coverage.domain.y.length, axis: 'y' });
				break;
			case 'Section':
			case 'Trajectory':
			case 'MultiPoint':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
			case 'MultiPointSeries':
				if (axesMaxes.has('vertical')) axesMaxes.delete('vertical');
				axesMaxes.set('horizontal', {
					axis: 'composite',
					value: coverage.domain.axes.composite.values.length
				});
			default:
				return;
		}
	});

	/**
	 * Primarily, the indices of the horizontal components of the domain
	 */
	let indices = $state(new SvelteMap<string, number>());

	$effect(() => {
		if (coverage?.indices) {
			for (let i in coverage.indices) indices.set(i, coverage?.indices[i]);
			return;
		}
		for (let i in coverage?.domain.axes) {
			indices.set(i, 0);
		}
	});
	$effect(() => {
		// Reset the indices on change
		indices.set(pageWith, page - 1);
	});
	let pageCount = $derived.by(() => {
		if (!coverage || coverage.domain.domainType !== 'Grid') return 0;
		return coverage.domain[pageWith].length;
	});

	$effect(() => {
		if (!coverage) return;
		// Run this on indices change
		onIndicesChange?.(coverage.uuid, Object.fromEntries(indices.entries()));
	});

	let dataPromises = $derived.by(async (): Promise<SeriesDataRow[]> => {
		if (!coverage) return [];
		let axisOfConcern: typeof pageWith = pageWith === 't' ? 'z' : 't';
		const axes = cartesianProduct(
			[...Array(coverage.domain[axisOfConcern].length || 1).keys()],
			[...Array(coverage.domain[pageWith].length || 1).keys()]
		).map((combo) => ({ [axisOfConcern]: combo[0], [pageWith]: combo[1] }));

		return await Promise.all(
			axes
				.map((k) => ({ ...Object.fromEntries(indices.entries()), ...k }))
				.map(async (indices) => {
					// console.log(parameters);
					const ranges = Array.from(parameters);
					return {
						...(await coverage.getData(indices, ranges)),
						t: coverage.domain.t[indices.t],
						z: coverage.domain.z[indices.z]
					};
				})
		);
	});

	function crementIndices(direction: '+' | '-', type: 'horizontal' | 'vertical') {
		if (!coverage) return;
		let stats = axesMaxes.get(type);
		if (!stats) return;
		let { axis, value: max } = stats;
		let value = indices.get(axis)!;
		value = direction === '-' ? value - 1 : value + 1;
		if (value < 0) value = max - 1;
		if (value >= max) value = 0;
		indices.set(axis, value);
	}

	// $inspect(Object.fromEntries(indices.entries()));
</script>

<Card.Root class="mt-2 ml-2 h-screen w-full max-w-sm">
	<Card.Header>
		<Card.Title>
			{coverage?.domain.domainType || 'No Coverage Selected'}
		</Card.Title>
		<!-- <Card.Action>
			<Button
				variant="outline"
				onclick={() => {
					if (pageWith === 'z') pageWith = 't';
					else pageWith = 'z';
					indices.set('t', 0);
					indices.set('z', 0);
					page = 1; // Reset the indices
				}}>Page with "{(pageWith === 'z' ? 't' : 'z').toUpperCase()}" axis</Button
			>
		</Card.Action> -->
	</Card.Header>
	<Card.Content>
		{#await dataPromises}
			<Skeleton />
		{:then data}
			<BarChart
				{data}
				config={chartConfig}
				orientation={'horizontal'}
				yScale={scaleBand()}
				props={{
					bars: { stroke: 'none' },
					radius: 5,
					insets: { left: 24 },
					rounded: 'all',
					motion: { type: 'tween', duration: 500, easing: cubicInOut },
					highligh: { area: { fill: 'none' } },
					yAxis: { format: (d) => d }
				}}
			/>
		{/await}
	</Card.Content>
	<!-- <Card.Footer class="grid grid-cols-1 place-items-center gap-1.5">
		<ButtonGroup.Root orientation="vertical" class="items-center">
			{#if axesMaxes.get('vertical')?.value || 0 > 1}
				<Button variant="outline" size="icon" onclick={() => crementIndices('+', 'vertical')}
					><ArrowUp /></Button
				>
			{/if}
			{#if axesMaxes.get('horizontal')?.value || 0 > 1}
				<ButtonGroup.Root orientation="horizontal" class="gap-2">
					<Button variant="outline" size="icon" onclick={() => crementIndices('-', 'horizontal')}>
						<ArrowLeft /></Button
					>
					<Button variant="outline" size="icon" disabled><Grip /></Button>
					<Button variant="outline" size="icon" onclick={() => crementIndices('+', 'horizontal')}
						><ArrowRight /></Button
					>
				</ButtonGroup.Root>
			{/if}
			{#if axesMaxes.get('vertical')?.value || 0 > 1}
				<Button variant="outline" size="icon" onclick={() => crementIndices('-', 'vertical')}
					><ArrowDown /></Button
				>
			{/if}
		</ButtonGroup.Root>
		{#if pageCount > 0}
			<Pagination.Root bind:page count={pageCount} perPage={1}>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.Previous />
						</Pagination.Item>
						{#each pages as page, i (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Item>
									<Pagination.Ellipsis />
								</Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link {page} isActive={currentPage === page.value}>
										{coverage?.domain?.[pageWith][i]}
									</Pagination.Link>
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
						<Pagination.Item>
							<Pagination.Next />
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		{/if}
	</Card.Footer> -->
</Card.Root>
