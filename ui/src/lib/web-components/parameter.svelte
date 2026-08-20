<script lang="ts">
	import type { Parameter } from 'coveragejson';
	import { Parameter as PrClass } from '@murithigeo/covjson-core';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Collapsible from '../components/ui/collapsible/index.ts';
	import * as Item from '../components/ui/item/index.ts';
	import { Checkbox } from '../components/ui/checkbox/index.ts';
	import { buttonVariants } from '../components/ui/button/index.ts';
	import { type SvelteSet } from 'svelte/reactivity';
	import {
		RulerDimensionLineIcon,
		ChevronsUpDown,
		SunSnowIcon,
		LanguagesIcon
	} from '@lucide/svelte';
	import type { MetadataRenderProps } from './types.d.ts';

	interface Props extends MetadataRenderProps<Parameter | PrClass> {
		checked?: boolean;
		open?: boolean;
		selected?: SvelteSet<string>;
	}

	let {
		data = $bindable(),
		open = $bindable(false),
		detail,
		checked = $bindable(true),
		selected = $bindable()
	}: Props = $props();

	const uid = $props.id();
	let parameter = $derived(data instanceof PrClass ? data : new PrClass(data));
	const key = $derived(parameter.key || uid);

	let id = $derived(`param-${key}`);
	const label = $derived(parameter.label);
	const onCheckedChange = (checked: boolean) =>
		checked ? selected?.add(key) : selected?.delete(key);
</script>

<Collapsible.Root class="border" bind:open>
	<Item.Root class="w-full">
		<Item.Media>
			<!-- Not updating if p-group deselected -->
			<Checkbox checked={selected?.has(key)} {onCheckedChange} /></Item.Media
		>
		<Item.Content>
			<!-- use header tag  & actual value to make scrolling from parameterGroups easier -->
			<!-- Use  -->
			<Item.Title lang={label.query()?.tag}
				>{label.query()?.value || parameter.key || parameter.id}</Item.Title
			></Item.Content
		><Item.Actions>
			<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}>
				<ChevronsUpDown />
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>
	<Collapsible.Content class="ml-4">
		<Collapsible.Root
			disabled={!parameter.label.size && !parameter.description.size}
			id="{id}:i18n"
		>
			<Item.Root size="sm" variant="outline">
				<Item.Media><LanguagesIcon class="size-5" /></Item.Media>
				<Item.Content>
					<Item.Title lang="en">Internationalization</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost' })}
						disabled={!parameter.label.size && !parameter.description.size}
					>
						<ChevronsUpDown />
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
				<Item.Media><RulerDimensionLineIcon class="size-5" /></Item.Media>
				<Item.Content>
					<Item.Title>Unit</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost' })}
						disabled={!parameter.unit}
					>
						<ChevronsUpDown />
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
				<Item.Media>
					<SunSnowIcon />
				</Item.Media>
				<Item.Content>
					<Item.Title lang="en">Observed Property</Item.Title>
				</Item.Content>
				<Item.Actions>
					<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}>
						<ChevronsUpDown />
					</Collapsible.Trigger>
				</Item.Actions>
			</Item.Root>
			<Collapsible.Content>
				{#if parameter.observedProperty}
					<ObservedProperty data={parameter.observedProperty} {detail} />
				{/if}
			</Collapsible.Content>
		</Collapsible.Root>
	</Collapsible.Content>
</Collapsible.Root>
