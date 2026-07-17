<script lang="ts">
	import { Category as CategoryClass } from '@murithigeo/covjson-core';
	import type { Category } from 'coveragejson';
	import * as Table from '../components/ui/table/index.ts';
	import type { MetadataRenderProps } from './types.d.ts';

	type Props = MetadataRenderProps<(CategoryClass | Category)[]>;

	let { data = $bindable(), detail = 'simple' }: Props = $props();

	let categories = $derived<CategoryClass[]>(
		data.map((cat) => {
			if (cat instanceof CategoryClass) return cat;
			return new CategoryClass(cat);
		})
	);
</script>

<Table.Root>
	<Table.Caption>List of Categories and their Localization Values</Table.Caption>
	<Table.Header>
		<Table.Row>
			<!--            <Table.Head>Icon</Table.Head>-->
			<Table.Head>Category Id</Table.Head>
			<Table.Head>Scope</Table.Head>
			<Table.Head>Language</Table.Head>
			<Table.Head>Value</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each categories as { id, label, description } (id)}
			{#if detail === 'full'}
				{@const rowspan = label.locales.length + description.locales.length}

				{#each label.locales as lang, i (i)}
					<Table.Row>
						{#if i === 0}
							<Table.Cell {rowspan} class="border-r">{id}</Table.Cell>
							<Table.Cell rowspan={label.locales.length} class="border-r">Label</Table.Cell>
						{/if}
						<Table.Cell>{label.getTagName(lang)}</Table.Cell>
						<Table.Cell {lang}>{label.query(lang)}</Table.Cell>
					</Table.Row>
				{/each}

				{#each description.locales as lang, i (lang)}
					<Table.Row>
						{#if i === 0}
							<Table.Cell rowspan={description.locales.length} class="border-r"
								>Description</Table.Cell
							>
						{/if}
						<Table.Cell>{description.getTagName(lang)}</Table.Cell>
						<Table.Cell {lang}>{description.query(lang)}</Table.Cell>
					</Table.Row>
				{/each}
			{:else}
				{@const label_value = label.query()}
				{@const desc_value = description.query()}
				<Table.Row>
					<!--                    <Table.Cell rowspan={2}>-->
					<!--                        <SwatchComponent fallbackText={id}/>-->
					<!--                    </Table.Cell>-->
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
