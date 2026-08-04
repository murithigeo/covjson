<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { I18N } from '@murithigeo/covjson-core';
	import { cn } from '$lib/utils.js';
	import type { MetadataRenderProps } from './types.d.ts';

	type Props = MetadataRenderProps<Record<string, I18N>>;

	let { data = $bindable(), detail, class: className }: Props = $props();
	let numOfRows = $derived(Object.values(data).reduce((l, r) => l + r.size, 0));
</script>

<Table.Root class={cn(className)}>
	<Table.Header>
		<Table.Row>
			<Table.Head>Field</Table.Head>
			<Table.Head>Language</Table.Head>
			<Table.Head>Value</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#if numOfRows}
			{#each Object.entries(data) as [field, i18n] (field)}
				{#if detail === 'full'}
					{#each i18n as [lang, value], index (lang)}
						<Table.Row>
							{#if !index}
								<Table.Cell class="capitalize" rowspan={i18n.size}>{field}</Table.Cell>
							{/if}
							<Table.Cell>{i18n.getTagName(lang)}</Table.Cell>
							<Table.Cell {lang}>{value}</Table.Cell>
						</Table.Row>
					{/each}
				{:else}
					{@const value = i18n.query()}
					<Table.Row>
						<Table.Cell class="capitalize">{field}</Table.Cell>
						{#if !value}
							<Table.Cell colspan={2}>No Match Found</Table.Cell>
						{:else}
							<Table.Cell>{i18n.getTagName(value.tag!)}</Table.Cell>
							<Table.Cell>{value}</Table.Cell>
						{/if}
					</Table.Row>
				{/if}
			{/each}
		{:else}
			<Table.Row>
				<Table.Cell class="flex-row items-center gap-2" colspan={3}>No Data Found</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
