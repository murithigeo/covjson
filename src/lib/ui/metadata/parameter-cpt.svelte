<svelte:options customElement="covjson-parameter" />

<script lang="ts">
	import { Parameter, type RangeStatistics } from '#lib/core/index.ts';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Accordion from '#lib/components/ui/accordion/index.ts';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.ts';
	import * as Item from '#lib/components/ui/item/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import { Badge, type BadgeVariant } from '#lib/components/ui/badge/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import type { MetadataRenderProps } from './types';
	import CategoryTable from './category-table.svelte';
	import Stats from './parameter/stats.svelte';
	import * as Card from '#lib/components/ui/card/index.ts';
	import type { ParameterColor } from '../coverage/types';
	import Colour from './parameter/colour.svelte';

	interface Props extends MetadataRenderProps<Parameter> {
		stats?: RangeStatistics;
		checked?: boolean;
		colors?: ParameterColor;
		onCheckedChange?: (checked: boolean) => void;
	}

	let {
		data: parameter,
		stats,
		checked = $bindable(true),
		colors,
		onCheckedChange
	}: Props = $props();

	const variant: BadgeVariant = 'outline';
</script>

<Card.Root id="parameter-{parameter.key}">
	<Card.Header>
		<Card.Title class="flex flex-row space-x-2">
			<Label>{parameter.key}</Label>
			{#if stats?.dataType}
				<Badge {variant}>{stats.dataType}</Badge>
			{/if}
			{#if parameter.unit?.symbol?.value}
				<Badge {variant}>{parameter.unit.symbol.value}</Badge>
			{/if}
			<Colour color={colors?.default} />
		</Card.Title>

		<Card.Action>
			<ButtonGroup.Root class="space-x-2">
				<Checkbox bind:checked {onCheckedChange} />
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
							{colors}
							data={parameter.observedProperty.categories}
							stats={stats?.frequency}
						/>
					{/if}
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</Card.Content>
</Card.Root>
