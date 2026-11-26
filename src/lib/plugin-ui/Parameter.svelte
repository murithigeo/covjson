<svelte:options customElement="covjson-parameter" />

<script lang="ts">
	import { Parameter } from '#lib/core/index.js';
	import LocaleTable from './metadata/locale-table.svelte';
	import ObservedProperty from './metadata/observed-property.svelte';
	import * as Accordion from '#lib/components/ui/accordion/index.js';
	import * as Item from '#lib/components/ui/item/index.js';
	import { Badge, type BadgeVariant } from '#lib/components/ui/badge/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import CategoryTable from './metadata/category-table.svelte';
	import Stats from './metadata/parameter/stats.svelte';
	import * as Card from '#lib/components/ui/card/index.js';
	import Colour from './metadata/parameter/colour.svelte';
	import css from '../../routes/layout.css?inline';
	import type { RangeStatistics, ParameterColor } from './types.d.ts';

	let {
		parameter,
		stats,
		color,
		showTitle = true
	}: {
		parameter: Parameter;
		stats?: RangeStatistics;
		color?: ParameterColor;
		showTitle?: boolean;
	} = $props();

	let dataType = $derived(parameter.properties['data-type'] ?? stats?.['data-type']);
	const variant: BadgeVariant = 'outline';
</script>

<Card.Root id="parameter-{parameter.key}">
	<Card.Header>
		<Card.Title class="flex flex-row space-x-2">
			{#if showTitle}
				<Label>{parameter.key}</Label>
			{/if}
			{#if dataType}
				<Badge {variant}>{dataType}</Badge>
			{/if}
			{#if parameter.unit?.symbol?.value}
				<Badge {variant}>{parameter.unit.symbol.value}</Badge>
			{/if}
			<Colour color={color?.default} />
		</Card.Title>
	</Card.Header>
	<Card.Content>
		<Accordion.Root type="multiple" value={['stats', 'internationalization']}>
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
							{color}
							data={parameter.observedProperty.categories}
							frequencies={stats?.frequency}
						/>
					{/if}
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</Card.Content>
</Card.Root>

<svelte:element this={'style'}>{css}</svelte:element>
