<script lang="ts">
	import type { Parameter } from 'coveragejson';
	import { Parameter as ParameterClass } from '@murithigeo/covjson-core';
	import * as Card from '../components/ui/card/index.ts';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Collapsible from '../components/ui/collapsible/index.ts';
	import * as Item from '../components/ui/item/index.ts';
	import { Checkbox } from '../components/ui/checkbox/index.ts';
	import { buttonVariants } from '../components/ui/button/index.ts';
	import { SvelteSet } from 'svelte/reactivity';
	import type { MetadataRenderProps } from './types.d.ts';
	import {
		ChevronsUpDownIcon,
		LanguagesIcon,
		RulerIcon,
		GaugeIcon,
		TelescopeIcon,
		BanIcon
	} from '@lucide/svelte';
	interface Props extends MetadataRenderProps<Parameter | ParameterClass> {
		checked?: boolean;
		disabled?: boolean;
		selected?: SvelteSet<string>;
	}

	let {
		data = $bindable(),
		disabled,
		detail,
		selected = $bindable(),
		class: className
	}: Props = $props();

	let parameter = $derived.by(() => {
		if (data instanceof ParameterClass) return data;
		return new ParameterClass(data);
	});
</script>

<Card.Root aria-disabled={disabled} class={className}>
	<Card.Header>
		<Card.Title>{parameter.id || parameter.key}</Card.Title>
		<Card.Action>
			<Checkbox
				onCheckedChange={(checked) => {
					if (checked) selected?.add(parameter.key);
					else selected?.delete(parameter.key);
				}}
				value={parameter.key}
				checked={selected?.has(parameter.key)}
			/>
		</Card.Action>
	</Card.Header>
	<Card.Content class="flex flex-col gap-2">
		<Collapsible.Root
			disabled={!parameter.label.locales.length && !parameter.description.locales.length}
			id={'parameter-card-' + parameter.key + '-localization'}
		>
			<Item.Root size="sm" variant="outline">
				<Item.Media>
					<LanguagesIcon class="size-5" />
				</Item.Media>
				<Item.Content>
					<Item.Title lang="en">Localization</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
					>
						{#if parameter.label.locales.length || parameter.description.locales.length}
							<ChevronsUpDownIcon class="size-4" />
						{:else}
							<BanIcon />
						{/if}
					</Collapsible.Trigger>
				</Item.Actions>
			</Item.Root>
			<Collapsible.Content class="border-l" id={'parameter-card-' + parameter.key + '-categories'}>
				<LocaleTable
					data={{
						label: parameter.label,
						description: parameter.description
					}}
					{detail}
				/>
			</Collapsible.Content>
		</Collapsible.Root>

		<Collapsible.Root id={'parameter-card-' + parameter.key + '-unit'}>
			<Item.Root size="sm" variant="outline">
				<Item.Media>
					<RulerIcon class="size-5" />
				</Item.Media>
				<Item.Content>
					<Item.Title>Unit</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
						disabled={!parameter.unit}
					>
						{#if parameter.unit}
							<ChevronsUpDownIcon class="size-4" />
						{:else}
							<BanIcon />
						{/if}
					</Collapsible.Trigger>
				</Item.Actions>
			</Item.Root>
			{#if parameter.unit}
				<Collapsible.Content>
					{#if parameter.unit.symbol}
						<Item.Root>
							<Item.Media>
								<GaugeIcon />
							</Item.Media>
							<Item.Content>
								<Item.Title lang="en">{parameter.unit.symbol.value}</Item.Title>
								<Item.Description>
									{#if parameter.unit.symbol?.type}
										<a href={parameter.unit.symbol.type} rel="external"
											>{parameter.unit.symbol.type}</a
										>
									{:else}
										No Serialization Scheme
									{/if}
								</Item.Description>
							</Item.Content>
						</Item.Root>
					{/if}
					<LocaleTable data={{ label: parameter.unit.label }} {detail} />
				</Collapsible.Content>
			{/if}
		</Collapsible.Root>
		<Collapsible.Root>
			<Item.Root size="sm" variant="outline">
				<Item.Media>
					<TelescopeIcon />
				</Item.Media>
				<Item.Content>
					<Item.Title lang="en">Observed Property</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
					>
						<ChevronsUpDownIcon class="size-4" />
					</Collapsible.Trigger>
				</Item.Actions>
			</Item.Root>
			<Collapsible.Content>
				{#if parameter.observedProperty}
					<ObservedProperty data={parameter.observedProperty} {detail} />
				{/if}
			</Collapsible.Content>
		</Collapsible.Root>
	</Card.Content></Card.Root
>
