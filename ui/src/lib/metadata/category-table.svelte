<script lang="ts">
	import { Category as CatClass } from '@murithigeo/covjson-core';
	import type { Category } from 'coveragejson';
	import * as Table from '$lib/components/ui/table/index.ts';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.ts';
	import type { MetadataRenderProps } from './types.d.ts';
	const ctx = getDashCtx();

	let { data = $bindable() }: MetadataRenderProps<(CatClass | Category)[]> = $props();
	let categories = $derived.by(() => {
		return data.map((v) => (v instanceof CatClass ? v : new CatClass(v)));
	});
</script>

<Table.Root>
	<Table.Caption>List of Categories and their Localization Values</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head>Category Id</Table.Head>
			<Table.Head>Scope</Table.Head>
			<Table.Head>Language</Table.Head>
			<Table.Head>Value</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each categories as { id, label, description } (id)}
			{#if ctx.detail === 'full'}
				{@const rowspan = label.size + description.size}
				{#each label as [lang, value], i (lang)}
					<Table.Row>
						{#if i === 0}
							<Table.Cell {rowspan} class="border-r">{id}</Table.Cell>
							<Table.Cell rowspan={label.size} class="border-r">Label</Table.Cell>
						{/if}
						<Table.Cell>{label.getTagName(lang)}</Table.Cell>
						<Table.Cell {lang}>{value}</Table.Cell>
					</Table.Row>
				{/each}

				{#each description as [lang, value], i (lang)}
					<Table.Row>
						{#if i === 0}
							<Table.Cell rowspan={description.size} class="border-r">Description</Table.Cell>
						{/if}
						<Table.Cell>{description.getTagName(lang)}</Table.Cell>
						<Table.Cell {lang}>{value}</Table.Cell>
					</Table.Row>
				{/each}
			{:else}
				{@const label_value = label.query()}
				{@const desc_value = description.query()}
				<Table.Row>
					<Table.Cell rowspan={2}>
						{id}
					</Table.Cell>
					<Table.Cell>Label</Table.Cell>
					<Table.Cell>{label.getTagName(label_value?.tag || 'en')}</Table.Cell>
					<Table.Cell lang={label_value?.tag}>{label_value?.value || '--'}</Table.Cell>
				</Table.Row>
				<Table.Row>
					<Table.Cell>Description</Table.Cell>
					<Table.Cell>{description.getTagName(label_value?.tag || 'en')}</Table.Cell>
					<Table.Cell lang={desc_value?.tag}>{desc_value?.value || '--'}</Table.Cell>
				</Table.Row>
			{/if}
		{/each}
	</Table.Body>
</Table.Root>
