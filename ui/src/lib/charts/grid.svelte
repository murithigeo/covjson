<script lang="ts">
	import type { Grid as G, Coverage as C } from '$lib/core/coveragejson.d.ts';
	import {
		cartesianProduct,
		Coverage,
		Grid,
		load,
		type WithRequiredProperty
	} from '../core/index.ts';
	import * as Card from '../components/ui/card/index.js';
	import * as Pagination from '../components/ui/pagination/index.ts';
	import * as Carousel from '../components/ui/carousel/index.ts';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { LineChart } from 'layerchart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { scaleUtc } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import * as Chart from '../components/ui/chart/index.js';
	interface Props {
		parameters?: SvelteSet<string>;
		styling?: { [paramName: string]: Omit<Chart.ChartConfig[typeof paramName], 'label'> };
		// coverage?: WithRequiredProperty<Coverage<G>, 'indices'>;
	}

	// Also include a callback so that switching carousel item switches the grid cell in focus
	let { parameters = $bindable(), styling }: Props = $props();

	let page = $state(1);

	let coverage = $state<WithRequiredProperty<Coverage<G>, 'indices'>>();

	const indices = $derived({ x: 0, y: 0, t: page - 1 });

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

	interface DataRow {
		z?: number;
		t?: string;
		[variable: string]: string | number | null | undefined;
	}

	const promises = $derived.by((): Promise<DataRow[]> => {
		const z = coverage?.domain.z.length ? coverage?.domain.z : [undefined]; // Make sure we have the data even if theres no z values
		if (!coverage) return Promise.resolve([]);
		return Promise.all(
			[...Array(z.length).keys()]
				.map((z) => ({ ...indices, z }))
				.map(async (indices) => {
					return {
						...(await coverage?.getData(indices)),
						z: indices.z !== undefined ? coverage?.domain?.z[indices.z] : undefined
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
