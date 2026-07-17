<script lang="ts">
	import type { ObservedProperty } from 'coveragejson';
	import * as Card from '../components/ui/card/index.ts';
	import { ObservedProperty as ObservedPropertyClass } from '@murithigeo/covjson-core';
	import { BanIcon } from '@lucide/svelte';
	import LocaleTable from './locale-table.svelte';
	import CategoryTable from './category-table.svelte';
	import type { MetadataRenderProps } from './types.d.ts';

	type Props = MetadataRenderProps<ObservedProperty | ObservedPropertyClass>;

	let { data, detail }: Props = $props();
	let obs = $derived.by(() => {
		if (data instanceof ObservedPropertyClass) return data;
		return new ObservedPropertyClass(data);
	});
	let label = $derived(obs.label);
	let description = $derived(obs.description);
</script>

<Card.Root class="w-full">
	<Card.Header>
		{@const l = label?.query()}
		{@const d = description?.query()}
		<Card.Title lang={l?.tag}>
			{obs.id || l?.value || 'No Id Provided'}
		</Card.Title>
		<Card.Description lang={d?.tag}>
			{d?.value || 'No Description found'}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<LocaleTable
			data={{
				description,
				label
			}}
			{detail}
		/>
	</Card.Content>

	<Card.Footer class="flex-col items-center">
		{#if data.categories}
			<h5>Categories</h5>
			<CategoryTable data={data.categories} {detail} />
		{:else}
			<span class="flex flex-wrap items-center gap-2"><BanIcon /> No Categories found</span>
		{/if}
	</Card.Footer>
</Card.Root>
