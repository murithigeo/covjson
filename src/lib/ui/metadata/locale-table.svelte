<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import { I18N } from '#lib/core/index.ts';
	import { cn } from '#lib/utils.js';
	import type { MetadataRenderProps } from './types.d.ts';

	type Props = MetadataRenderProps<Record<string, I18N>>;

	let { data = $bindable() }: Props = $props();
	const cellStyle = 'border break-all whitespace-normal';
</script>

<Table.Root class="table-auto">
	<Table.Header>
		<Table.Row>
			<Table.Head>Field</Table.Head>
			<Table.Head>Language</Table.Head>
			<Table.Head>Value</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
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
	</Table.Body>
</Table.Root>
