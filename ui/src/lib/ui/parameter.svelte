<script lang="ts">
	import type { Parameter } from 'coveragejson';
	import { Parameter as ParameterClass } from '$lib/core/parameters.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import {
		ChevronsUpDownIcon,
		LanguagesIcon,
		RulerIcon,
		GaugeIcon,
		TelescopeIcon,
		BanIcon
	} from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import '../../routes/layout.css';
	import ObservedProperty from './observed-property.svelte';
	import LocaleTable from './locale-table.svelte';

	interface Props {
		data: Parameter | ParameterClass;
		checked?: boolean;
		disabled?: boolean;
		mode?: 'basic' | 'extended';
		selected?: SvelteSet<string>;
	}

	let { data, disabled, mode = 'extended', selected = $bindable() }: Props = $props();
	let parameter = $derived(data instanceof ParameterClass ? data : new ParameterClass(data, ''));

</script>

<Card.Root aria-disabled={disabled} class="w-full border" id={`parameter-${parameter.key}`}>
	<Card.Header>
		<Card.Title>
			{parameter.key}
		</Card.Title>

		<Card.Action>
			<Checkbox
				onCheckedChange={(checked) => {
					if (checked) selected?.add(parameter.key.toLowerCase());
					else selected?.delete(parameter.key.toLowerCase());
				}}
				value={parameter.key}
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
					{mode}
				/>
			</Collapsible.Content>
		</Collapsible.Root>

		<Collapsible.Root  id={'parameter-card-' + parameter.key + '-unit'}>
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
					<LocaleTable data={{ label: parameter.unit.label }} />
				</Collapsible.Content>
			{/if}
		</Collapsible.Root>
		<Collapsible.Root >
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
					<ObservedProperty data={parameter.observedProperty} {mode} />
				{/if}
			</Collapsible.Content>
		</Collapsible.Root>
	</Card.Content>
	<Card.Footer>

	</Card.Footer>
</Card.Root>
