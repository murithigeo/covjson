<script lang="ts">
	import type { ObservedProperty } from 'coveragejson';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ObservedProperty as ObsClass } from '@murithigeo/covjson-core';
	import LocaleTable from './locale-table.svelte';
	import CategoryTable from './category-table.svelte';
	import { cn } from '$lib/utils.js';
	import type { MetadataRenderProps } from './types.d.ts';

	type Data = ObservedProperty | ObsClass;

	let { data, detail, class: className }: MetadataRenderProps<Data> = $props();
	const toObs = () => (data instanceof ObsClass ? data : new ObsClass(data));
	const obs = $derived(toObs());
	let label = $derived(obs.label);
	let description = $derived(obs.description);
</script>

<Card.Root class={cn(className)}>
	<Card.Header>
		{@const l = label?.query()}
		{@const d = description?.query()}
		<Card.Title lang={l?.tag}>
			{obs.id || l?.value || 'No Id Provided'}
		</Card.Title>
		<Card.Description lang={d?.tag}>
			<Label>{d?.value || 'No Description found'}</Label>
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
			<span class="flex flex-wrap items-center gap-2"> No Categories found</span>
		{/if}
	</Card.Footer>
</Card.Root>
