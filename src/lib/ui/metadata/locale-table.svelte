<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import { I18N } from '#lib/core/index.ts';
	import { cn } from '#lib/utils.js';
	import type { MetadataRenderProps } from './types.d.ts';

	type Props = MetadataRenderProps<Record<string, I18N>>;

	let { data = $bindable() }: Props = $props();
	const cellStyle = 'border break-all whitespace-normal';
	let numOfRows = $derived(Object.values(data).reduce((l, r) => l + r.size, 0));
</script>

<Table.Root class="table-auto">
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-fit">Field</Table.Head>
			<Table.Head>Language</Table.Head>
			<Table.Head>Value</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#if numOfRows}
			{#each Object.entries(data) as [field, i18n] (field)}
				{#each i18n as [lang, value], index (lang)}
					<Table.Row>
						{#if !index}
							<Table.Cell class={cn(cellStyle, 'whitespace-nowrap capitalize')} rowspan={i18n.size}
								>{field}</Table.Cell
							>
						{/if}
						<Table.Cell class={cn(cellStyle, '')}>{i18n.getTagName(lang)}</Table.Cell>
						<Table.Cell {lang} class={cn(cellStyle, '')}>{value}</Table.Cell>
					</Table.Row>
				{/each}
			{/each}
		{:else}
			<Table.Row>
				<Table.Cell class="flex-row items-center gap-2" colspan={3}>No Data Found</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
