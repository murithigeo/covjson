<svelte:options customElement="covjson-parameter" />

<script lang="ts">
	import { isNull, Parameter, type RangeStatistics } from '#lib/core/index.ts';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Accordion from '#lib/components/ui/accordion/index.js';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import * as Item from '#lib/components/ui/item/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Badge, type BadgeVariant } from '#lib/components/ui/badge/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import type { MetadataRenderProps, OnColorChange } from './types';
	import ColorPicker from './parameter/color-picker.svelte';
	import CategoryTable from './category-table.svelte';
	import Stats from './parameter/stats.svelte';
	import * as Card from '#lib/components/ui/card/index.ts';
	import { getRandomColor } from '#lib/utils.ts';

	interface Props extends MetadataRenderProps<Parameter> {
		stats?: RangeStatistics;
		color?: string;
		onColorChange?: OnColorChange;
		key?: string;
		checked?: boolean;
		checkable?: boolean;
	}

	let {
		data: parameter = $bindable(),
		stats = $bindable(),
		color = $bindable(getRandomColor()),
		checkable = $bindable(true),
		key: pKey,
		checked = $bindable(true),
		onColorChange
	}: Props = $props();

	let key = $derived(pKey || parameter.key);

	const variant: BadgeVariant = 'outline';
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex flex-row space-x-2">
			<Label>{key}</Label>
			{#if stats?.dataType}
				<Badge {variant}>{stats.dataType}</Badge>
			{/if}
			{#if parameter.unit?.symbol?.value}
				<Badge {variant}>{parameter.unit.symbol.value}</Badge>
			{/if}
		</Card.Title>

		<Card.Action>
			<ButtonGroup.Root class="space-x-2">
				<ColorPicker
					bind:hex={color}
					onInput={({ hex }) => {
						if (isNull(hex)) return;
						onColorChange?.(parameter, hex);
					}}
					label=""
				/>
				{#if checkable}
					<Checkbox bind:checked disabled={!checkable} />
				{/if}
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Accordion.Root type="multiple">
			{#if stats}
				<Accordion.Item value="stats">
					<Accordion.Trigger>Statistics</Accordion.Trigger>
					<Accordion.Content>
						<Stats {...stats} class="grid grid-cols-2 gap-1" />
					</Accordion.Content>
				</Accordion.Item>
			{/if}
			<Accordion.Item
				value="internationalization"
				disabled={!(parameter.label.size + parameter.description.size)}
			>
				<Accordion.Trigger>Internationalization</Accordion.Trigger>
				<Accordion.Content
					>{#if parameter.label.size + parameter.description.size}
						<LocaleTable
							data={{
								label: parameter.label,
								description: parameter.description
							}}
						/>{/if}</Accordion.Content
				>
			</Accordion.Item>
			<Accordion.Item value="unit" disabled={!parameter.unit}>
				<Accordion.Trigger>Unit</Accordion.Trigger>
				<Accordion.Content class="flex-col space-y-2">
					{#if parameter.unit?.symbol}
						<Item.Root>
							<Item.Content>
								<Item.Title lang="en"><Label>{parameter.unit.symbol.value}</Label></Item.Title>
								<Item.Description>
									{#if parameter.unit.symbol?.type}
										<a href={parameter.unit.symbol.type}>{parameter.unit.symbol.type}</a>
									{:else}
										No Serialization Scheme
									{/if}
								</Item.Description>
							</Item.Content>
						</Item.Root>
					{/if}
					{#if parameter.unit?.label}
						<LocaleTable data={{ label: parameter.unit.label }} />
					{/if}
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="observedProperty">
				<Accordion.Trigger disabled={!parameter.observedProperty}
					>Observed Property</Accordion.Trigger
				>
				<Accordion.Content>
					{#if parameter.observedProperty}
						<!-- Why if? -->
						<ObservedProperty data={parameter.observedProperty} />
					{/if}
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="categoryEncoding" disabled={!parameter.observedProperty.categories}>
				<Accordion.Trigger>Category Encoding</Accordion.Trigger>
				<Accordion.Content>
					{#if parameter.observedProperty.categories}
						<CategoryTable
							data={parameter.observedProperty.categories}
							onColorChange={(catId, color) => onColorChange?.(parameter, color, catId)}
							stats={stats?.frequency}
						/>
					{/if}
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</Card.Content>
</Card.Root>
