<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import type { MetadataRenderProps } from './types.d.ts';
	import { cn } from '#lib/utils.js';
	import ColorPicker from './parameter/color-picker.svelte';
	import type { Category } from '#lib/core/parameters.ts';
	import type { RangeStatistics } from '#lib/core/ranges.ts';
	import { isNull } from '#lib/core/index.ts';

	interface Props extends MetadataRenderProps<Category[]> {
		onColorChange: (catId: string, color: string) => void;
		/**
		 * The initial color
		 */
		color?: string;
		/**
		 * The count of each category
		 */
		stats?: RangeStatistics['frequency'];
	}
	let {
		data: categories = $bindable(),
		onColorChange,
		color: hex,
		stats = $bindable()
	}: Props = $props();

	const cellStyle = 'border break-all whitespace-normal';
</script>

<Table.Root class="table-auto">
	<Table.Caption>List of Categories and their Localization Values</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head></Table.Head>
			<Table.Head>Id</Table.Head>
			<Table.Head>n</Table.Head>
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
							<Table.Cell {rowspan} class={cn(cellStyle, 'rounded-full')}
								><ColorPicker
									{hex}
									onInput={({ hex }) => {
										if (isNull(hex)) return;
										onColorChange?.(id, hex);
									}}
									label=""
								/></Table.Cell
							>
							<Table.Cell {rowspan} class={cn(cellStyle, '')}>{id}</Table.Cell>
							<Table.Cell {rowspan} class={cn(cellStyle)}>{stats?.get(id) || 0}</Table.Cell>
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
