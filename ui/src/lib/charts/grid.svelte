<script lang="ts">
	import type { Grid as G, Coverage as C } from '../../../../core/src/coveragejson.d.ts';
	import type { DataRow } from './types.d.ts';
	import { Coverage, load, type WithRequiredProperty } from '@murithigeo/covjson-core';
	import * as Card from '../components/ui/card/index.ts';
	import * as Pagination from '../components/ui/pagination/index.ts';
	import * as Carousel from '../components/ui/carousel/index.ts';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { LineChart } from 'layerchart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { scaleUtc } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import * as Chart from '../components/ui/chart/index.ts';
	interface Props {
		parameters?: SvelteSet<string>;
		styling?: { [paramName: string]: Omit<Chart.ChartConfig[typeof paramName], 'label'> };
		/**
		 * How to tile the data. Means that the each value in the axis IDd by this variable has its own page
		 */
		sliceBy?: keyof Pick<G['axes'], 't' | 'z'>;
		coverage?: WithRequiredProperty<Coverage<G>, 'indices'>;
	}

	// Also include a callback so that switching carousel item switches the grid cell in focus
	let { parameters = $bindable(), styling, sliceBy = $bindable('t'), coverage }: Props = $props();

	let page = $state(1);

	const indices = $derived({ ...coverage?.indices, [sliceBy]: page - 1 });

	onMount(async () => {
		coverage = await load<C<G>>('https://covjson.org/playground/coverages/grid-tiled.covjson')
			.then(Coverage.load)
			.then((coverage) => {
				if (coverage.parameters && !parameters)
					parameters = new SvelteSet(coverage.parameters.keys());
				return coverage;
			})
			.catch((err) => {
				console.error(err);
				return undefined;
			});
	});

	const promises = $derived.by((): Promise<DataRow[]> => {
		if (!coverage) return Promise.resolve([]);

		const chartAxis = sliceBy === 't' ? 'z' : 't';
		const {
			domain: { [chartAxis]: chartAxisVals }
		} = coverage;

		const totalPoints = [...Array(chartAxisVals.length || 1).keys()]; // Ensure that even if chartingAxis/sliceBy is undefined, the default axes still get data
		return Promise.all(
			totalPoints
				.map((v) => ({ ...indices, [chartAxis]: v }))
				.map(async (indices) => {
					return {
						...(await coverage?.getData(indices)),
						[chartAxis]: chartAxisVals[indices[chartAxis]]
					};
				})
		);
	});

	const chartConfig = $derived<Chart.ChartConfig | undefined>(
		parameters?.keys().reduce((l: Chart.ChartConfig, r) => {
			const param = coverage?.parameters.get(r);
			l[r] = { label: param?.label.query()?.value ?? r };
			if (styling?.[r]) l[r] = { ...l[r], ...styling[r] };
			return l;
		}, {})
	);
</script>

<Card.Root class="mt-2 ml-2 max-w-sm">
	<Card.Header>
		<Card.Title>Grid Coverage</Card.Title>
	</Card.Header>
	<Card.Content>
		<Carousel.Root></Carousel.Root>
	</Card.Content>
	<Card.Footer>
		<Pagination.Root count={coverage?.domain.t.length || 0} bind:page perPage={1}>
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
									{coverage?.domain?.t[i]}
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
	</Card.Footer>
</Card.Root>
