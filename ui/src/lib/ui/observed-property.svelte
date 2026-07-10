<script lang="ts">
	import type { ObservedProperty } from 'coveragejson';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ObservedProperty as ObservedPropertyClass } from '../core/parameters.ts';
	import { BanIcon } from '@lucide/svelte';
	import LocaleTable from './locale-table.svelte';
	import CategoryTable from './category-table.svelte';

	interface Props {
		data: ObservedProperty | ObservedPropertyClass;
		mode?: 'basic' | 'extended';
	}

	let { data, mode }: Props = $props();
	let obs = $derived(
		data instanceof ObservedPropertyClass ? data : new ObservedPropertyClass(data)
	);
	let label = $derived(obs.label.value);
	let description = $derived(obs.description?.value);

	// h1: CoverageJSON.ID
	// h2: Map, Metadata Section, CHarts
	// h3: Parameters, Parameter Group
	// h4: Localization, ObservedProperty, Unit, CategoryEncoding
	// h5: obs.id, obs.localization, obs.categories
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title lang={label?.tag}>
			{obs.id || obs.label.value?.value || 'No Id Provided'}
		</Card.Title>
		<Card.Description lang={description?.tag}>
			{description?.value || 'No Description found'}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{@const label = obs.label}
		{@const description = obs.description}
		<LocaleTable
			data={{
				description,
				label
			}}
			{mode}
		/>
	</Card.Content>

	<!--    Since this might be a long table, why not make it a snippet-->
	<Card.Footer class="flex-col items-center">
		{#if data.categories}
			<h5>Categories</h5>

			<CategoryTable data={data.categories} {mode} />
		{:else}
			<span class="flex flex-wrap items-center gap-2"><BanIcon /> No Categories found</span>
		{/if}
	</Card.Footer>
</Card.Root>
