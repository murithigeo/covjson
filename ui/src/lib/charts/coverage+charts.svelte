<script lang="ts">
	import type { Coverage } from '../core/index.ts';
	
	import type { SvelteSet } from 'svelte/reactivity';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { Button, buttonVariants } from '../components/ui/button/index.ts';

	interface Props {
		coverage?: Coverage & { indices: Record<string, number> };
		selectedParameters?: SvelteSet<string>;
		z?: number;
		t?: string;
		/**
		 * If the domain is grid and both axis have more than two values, what axis to tile by
		 */
		// paginateBy?: 'z' | 't';
	}
	// For grid, tabulate by t,z
	// For multipoint, by t and composite
	// for multipolyg

	// We can have table view for string/number
	// And charts for number
	let {
		coverage = $bindable(),
		selectedParameters = $bindable(),
		t = $bindable(),
		z = $bindable()
	}: Props = $props();

	
	// The only thing that has paging is the Grid Domain because of multiple values in the z-axis
	let drawerOpen = $state(false);
</script>


<Card.Root>
{#if coverage}
	<Card.Header>
	
		<Card.Title>{coverage?.domain?.domainType}</Card.Title>
		{#if coverage?.id}
			<Card.Description>Id: {coverage.id}</Card.Description>
		{/if}

		<Card.Action>
			<Button
				variant="outline"
				onclick={() => {
					drawerOpen = !drawerOpen;
				}}
			/>
		</Card.Action>
	</Card.Header>
	<Card.Content></Card.Content>
	<Card.Footer>
		<!-- 
		
		<Pagination.Root {count} perPage={10} bind:page={compositeIndex}>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.Previous />
					</Pagination.Item>
					{#each pages as page (page.key)}
						<Pagination.Item>
							{#if page.type === 'ellipsis'}
								<Pagination.Ellipsis />
							{:else}
								<Pagination.Link {page} isActive={currentPage === page.value}>
									{page.value}
								</Pagination.Link>
							{/if}
						</Pagination.Item>
					{/each}
					<Pagination.Item>
						<Pagination.Ellipsis />
					</Pagination.Item>
					<Pagination.Item>
						<Pagination.Next />
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root> -->
	</Card.Footer>
	{/if}
</Card.Root>
