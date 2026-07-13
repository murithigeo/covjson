<script lang="ts">
	// tag:coverage-previewe
	import { type ChartConfig } from '../components/ui/chart/index.ts';
	import * as Card from '../components/ui/card/index.ts';
	import * as Pagination from '../components/ui/pagination/index.ts';
	import * as Carousel from '../components/ui/carousel/index.ts';
	import { Coverage } from '@murithigeo/covjson-core';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Grid } from '../../../../core/src/coveragejson.d.ts';
	import { Skeleton } from '../components/ui/skeleton/index.ts';

	interface DomainOptions {
		/**
		 * Intended to handle the scenario where grids have more than 1 t/z values each.
		 * Sure I could create chart with the horizontal axis being t and z being vertical but what about the values?
		 * So just paginate, default is t
		 */
		paginateBy?: keyof Pick<Grid['axes'], 't' | 'z'>;
	}
	interface Props extends DomainOptions {
		coverage?: Coverage;
		chartConfig: ChartConfig;
		chartType?: 'line' | 'bar';
		/**
		 * A reactive set of the current parameters selected.
		 * If undefined, defaults to all keys of the coverage's ranges
		 */
		parameters?: SvelteSet<string>;
		/**
		 * Intended to be used with a mapping tool to shift focus once indices have changed
		 * @todo maplibre implement styling to highlight current grid cell
		 * @example grid
		 * map.flyTo({center:[coverage.domain.x[indices.x],coverage.domain.axes.y[indices.y]})
		 */
		onIndicesChange(coverage: Coverage, indices: Record<string, number>): void;
	}

	let { coverage, chartConfig, chartType, paginateBy = $bindable('t') }: Props = $props();
	/**
	 * If paginated, the current page
	 */
	let page = $state(1);
	/**
	 * The number of left-right and updown carousel items
	 */
	let [maxHCarouselItems, maxVCarouselItems] = $derived.by((): [number, number] => {
		let maxH = 0,
			maxV = 0;
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
</script>

<Card.Root class="mt-2 ml-2 w-full max-w-sm">
	<Card.Header>
		<Card.Title>
			{coverage?.domain.domainType || 'No Coverage Selected'}
		</Card.Title>
	</Card.Header>
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
