<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import type { Category } from '#lib/core/parameters.js';
	import Color from './parameter/colour.svelte';
	import type { Frequencies, ParameterColor } from '../types.js';
	import { cn } from '#lib/utils.js';

	interface Props {
		data: Category[];
		color?: ParameterColor;
		/**
		 * The count of each category
		 */
		frequencies?: Frequencies;
	}
	let { data: categories, color, frequencies }: Props = $props();
	let showcolor = $derived(color && Object.keys(color).length > 1);
	const cellStyle = 'border break-all whitespace-normal';
</script>

<Table.Root class="table-auto">
	<Table.Caption>List of Categories and their Localization Values</Table.Caption>
	<Table.Header>
		<Table.Row>
			{#if showcolor}
				<Table.Head></Table.Head>
			{/if}
			<Table.Head>Id</Table.Head>
			{#if frequencies}
				<Table.Head>n</Table.Head>
			{/if}
			<Table.Head>Scope</Table.Head>
			<Table.Head>Language</Table.Head>
			<Table.Head>Value</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#if categories}
			{#each categories as { id, label, description } (id)}
				{@const rowspan = label.size + description.size}
				{#each label as [lang, value], i (lang)}
					<Table.Row>
						{#if i === 0}
							{#if showcolor}
								<Table.Cell {rowspan} class={cn(cellStyle, 'rounded-full')}
									><Color color={color?.[id] ?? color?.default} /></Table.Cell
								>
							{/if}
							<Table.Cell {rowspan} class={cn(cellStyle, '')}>{id}</Table.Cell>
							{#if frequencies}
								<Table.Cell {rowspan} class={cn(cellStyle)}>{frequencies?.get(id) || 0}</Table.Cell>
							{/if}
							<Table.Cell rowspan={label.size} class={cn(cellStyle, 'whitespace-nowrap')}
								>Label</Table.Cell
							>
						{/if}
						<Table.Cell class={cn(cellStyle, '')}>{label.getTagName(lang)}</Table.Cell>
						<Table.Cell class={cn(cellStyle, '')} {lang}>{value}</Table.Cell>
					</Table.Row>
				{/each}

				{#each description as [lang, value], i (lang)}
					<Table.Row>
						{#if i === 0}
							<Table.Cell rowspan={description.size} class={cn(cellStyle, 'whitespace-normal')}
								>Description</Table.Cell
							>
						{/if}
						<Table.Cell class={cn(cellStyle, '')}>{description.getTagName(lang)}</Table.Cell>
						<Table.Cell class={cn(cellStyle, '')} {lang}>{value}</Table.Cell>
					</Table.Row>
				{/each}
			{/each}
		{/if}
	</Table.Body>
</Table.Root>
