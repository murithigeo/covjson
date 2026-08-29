<script lang="ts">
	import { Category } from '@murithigeo/covjson-core';
	import * as Table from '$lib/components/ui/table/index.js';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import type { MetadataRenderProps } from './types.d.ts';
	import { cn } from '$lib/utils.js';
	const ctx = getDashCtx();

	let { data: categories = $bindable() }: MetadataRenderProps<Category[]> = $props();

	const cellStyle = 'border break-all whitespace-normal';
</script>

<Table.Root class="table-fixed">
	<Table.Caption>List of Categories and their Localization Values</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head>Id</Table.Head>
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
							<Table.Cell {rowspan} class={cn(cellStyle, '')}>{id}</Table.Cell>
							<Table.Cell rowspan={label.size}>Label</Table.Cell>
						{/if}
						<Table.Cell class={cn(cellStyle, '')}>{label.getTagName(lang)}</Table.Cell>
						<Table.Cell class={cn(cellStyle, '')} {lang}>{value}</Table.Cell>
					</Table.Row>
				{/each}

				{#each description as [lang, value], i (lang)}
					<Table.Row>
						{#if i === 0}
							<Table.Cell rowspan={description.size} class={cn(cellStyle, '')}
								>Description</Table.Cell
							>
						{/if}
						<Table.Cell class={cn(cellStyle, '')}>{description.getTagName(lang)}</Table.Cell>
						<Table.Cell class={cn(cellStyle, '')} {lang}>{value}</Table.Cell>
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
