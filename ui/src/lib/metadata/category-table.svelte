<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import * as Item from '#lib/components/ui/item/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { getDashCtx } from '#lib/dashboards/utils/ctx.svelte.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import type { MetadataRenderProps } from './types.d.ts';
	import { ReactiveParameter } from '#lib/dashboards/utils/parameter.svelte.js';
	import { cn } from '#lib/utils.js';
	import ColorPicker from './parameter/color-picker.svelte';
	import { ChevronsUpDownIcon, ChartColumnStacked } from '@lucide/svelte';

	type Props = MetadataRenderProps<ReactiveParameter['categories'], { parameterKey: string }>;
	let { data: categories = $bindable(), parameterKey }: Props = $props();
	const ctx = getDashCtx();

	const cellStyle = 'border break-all whitespace-normal';
</script>

<Collapsible.Root disabled={!categories.size}>
	<Item.Root size="sm" variant="outline">
		<Item.Media variant="icon"><ChartColumnStacked /></Item.Media>
		<Item.Content>Category Encodings</Item.Content>
		<Item.Actions
			><Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}>
				<ChevronsUpDownIcon />
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>

	<Collapsible.Content>
		<Card.Root>
			<Card.Content>
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
							{#each categories as [, { id, label, description, color: hex, size }] (id)}
								{@const rowspan = label.size + description.size}
								{#each label as [lang, value], i (lang)}
									<Table.Row>
										{#if i === 0}
											<Table.Cell {rowspan} class={cn(cellStyle, 'rounded-full')}
												><ColorPicker
													{hex}
													onInput={({ hex }) => ctx.setParameterColor(parameterKey, hex, id)}
													label=""
												/></Table.Cell
											>
											<Table.Cell {rowspan} class={cn(cellStyle, '')}>{id}</Table.Cell>
											<Table.Cell {rowspan} class={cn(cellStyle)}>{size || 0}</Table.Cell>
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
											<Table.Cell
												rowspan={description.size}
												class={cn(cellStyle, 'whitespace-normal')}>Description</Table.Cell
											>
										{/if}
										<Table.Cell class={cn(cellStyle, '')}>{description.getTagName(lang)}</Table.Cell
										>
										<Table.Cell class={cn(cellStyle, '')} {lang}>{value}</Table.Cell>
									</Table.Row>
								{/each}
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</Collapsible.Content>
</Collapsible.Root>
