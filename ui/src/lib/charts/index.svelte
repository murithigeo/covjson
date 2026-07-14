<script lang="ts">
	// tag:coverage-previewe
	import { type ChartConfig } from '../components/ui/chart/index.ts';
	import * as Card from '../components/ui/card/index.ts';
	import * as Pagination from '../components/ui/pagination/index.ts';
	import { Button } from '../components/ui/button/index.ts';
	import { Coverage } from '@murithigeo/covjson-core';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Grid } from '../../../../core/src/coveragejson.d.ts';
	import { Skeleton } from '../components/ui/skeleton/index.ts';
	import type { OnIndicesChange } from '@murithigeo/covjson-maplibre';
	import { ArrowLeft } from '@lucide/svelte';
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
		paginateBy?: keyof Pick<Grid['axes'], 't' | 'z'>;
	}

	let {
		coverage = $bindable(),
		chartConfig,
		chartType,
		paginateBy = $bindable('t'),
		onIndicesChange
	}: Props = $props();
	/**
	 * If paginated, the current page
	 */
	let page = $state(1);
	/**
	 * Current indices
	 */
	let indices = $derived.by<Record<string, number> | undefined>(() => {
		if (!coverage) return undefined;
		if (coverage.indices) return coverage.indices;
		return Object.keys(coverage.domain.axes).reduce((l, r) => ({ ...l, [r]: 0 }), {});
	});
	/**
	 * The number of left-right and updown carousel items
	 */
	let [maxHCarouselItems, maxVCarouselItems] = $derived.by((): [number, number] => {
		// Move all button related logic under here
		let [maxH, maxV] = [1, 1];
		if (!coverage) return [maxH, maxV];
		switch (coverage.domain.domainType) {
			case 'Grid':
				[maxH, maxV] = [coverage.domain.x.length, coverage.domain.y.length];
				break;
			case 'MultiPoint':
			case 'MultiPointSeries':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
			case 'Section':
			case 'Trajectory':
				maxH = coverage.domain.axes.composite.values.length;
				break;
		}
		return [maxH, maxV];
	});

	let pageCount = $derived.by(() => {
		if (!coverage || coverage.domain.domainType !== 'Grid') return 0;
		return coverage.domain[paginateBy].length;
	});

	$effect(() => {
		if (!coverage || !indices) return;
		// Run this on indices change
		onIndicesChange?.(coverage.uuid, indices);
	});
	function crementHorizontal(direction: '+' | '-') {
		if (!indices || !coverage) return;
		let axis: string;
		let max: number;
		switch (coverage?.domain.domainType) {
			case 'Grid':
				axis = 'x';
				max = coverage.domain.x.length;
				break;
			case 'Section':
			case 'Trajectory':
			case 'MultiPoint':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
			case 'MultiPointSeries':
				max = coverage.domain.axes.composite.values.length;
				axis = 'composite';
			default:
				return;
		}
		if (direction === '-') {
			if (indices[axis] < 1) return;
			indices = { ...indices, [axis]: indices[axis] - 1 };
			return;
		}
		if (indices[axis] >= max - 1) return;
		indices = { ...indices, [axis]: indices[axis] + 1 };
	}
	$inspect(indices);
</script>

<Card.Root class="mt-2 ml-2 h-screen w-full max-w-sm">
	<Card.Header>
		<Card.Title>
			{coverage?.domain.domainType || 'No Coverage Selected'}
		</Card.Title>
	</Card.Header>
	<Card.Content>
		<Button variant="outline" id="left" onclick={() => crementHorizontal('-')}
		disabled={}
			><ArrowLeft />
		</Button>

		<!-- Have buttons left,right, bottom up -->
	</Card.Content>
	<Card.Footer>
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
										{coverage?.domain?.[paginateBy][i]}
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
	</Card.Footer>
</Card.Root>
