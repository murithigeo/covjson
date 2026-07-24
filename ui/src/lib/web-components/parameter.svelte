<svelte:options customElement={{ tag: 'parameter-preview', shadow: 'none' }} />

<script lang="ts">
	import type { Parameter } from 'coveragejson';
	import { Parameter as PrClass } from '@murithigeo/covjson-core';
	import * as Card from '../components/ui/card/index.ts';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Collapsible from '../components/ui/collapsible/index.ts';
	import * as Item from '../components/ui/item/index.ts';
	import { Checkbox } from '../components/ui/checkbox/index.ts';
	import { buttonVariants } from '../components/ui/button/index.ts';
	import { cn } from '$lib/utils.js';
	import type { MetadataRenderProps, ParameterToggleEventDetail } from './types.d.ts';

	interface Props extends MetadataRenderProps<Parameter | PrClass> {
		checked?: boolean;
		disabled?: boolean;
	}

	let { data = $bindable(), disabled, detail, class: className }: Props = $props();

	let parameter = $derived(data instanceof PrClass ? data : new PrClass(data));
	let id = $derived<string>('param:' + (parameter.key || parameter.id));
	let checked = $state(true);
	const dispatch = (checked: boolean) => {
		const event = new CustomEvent<ParameterToggleEventDetail>('toggle-parameter', {
			detail: { [data.key]: checked }
		});
		$host().dispatchEvent(event);
	};
	$effect(() => dispatch(checked));
</script>

<Card.Root aria-disabled={disabled} class={cn(className)} {id}>
	<Card.Header>
		<Card.Title>{parameter.id || parameter.key}</Card.Title>
		<Card.Action>
			<Checkbox value={parameter.key} bind:checked />
		</Card.Action>
	</Card.Header>
	<Card.Content class="flex flex-col gap-2">
		<Collapsible.Root
			disabled={!parameter.label.locales.length && !parameter.description.locales.length}
			id="{id}:i18n"
		>
			<Item.Root size="sm" variant="outline">
				<Item.Content>
					<Item.Title lang="en">Localization</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'outline' })}
						disabled={!parameter.label.locales.length && !parameter.description.locales.length}
					>
						Toggle
					</Collapsible.Trigger>
				</Item.Actions>
			</Item.Root>
			<Collapsible.Content class="border-l">
				<LocaleTable
					data={{
						label: parameter.label,
						description: parameter.description
					}}
					{detail}
				/>
			</Collapsible.Content>
		</Collapsible.Root>

		<Collapsible.Root id="{id}:unit">
			<Item.Root size="sm" variant="outline">
				<Item.Content>
					<Item.Title>Unit</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'outline' })}
						disabled={!parameter.unit}
					>
						Toggle
					</Collapsible.Trigger>
				</Item.Actions>
			</Item.Root>
			{#if parameter.unit}
				<Collapsible.Content>
					{#if parameter.unit.symbol}
						<Item.Root>
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
		<Collapsible.Root id="{id}:observed-property">
			<Item.Root size="sm" variant="outline">
				<Item.Content>
					<Item.Title lang="en">Observed Property</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger class={buttonVariants({ variant: 'outline' })}>
						Toggle
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
