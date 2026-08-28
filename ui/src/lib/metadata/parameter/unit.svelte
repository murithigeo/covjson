<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	import LocaleTable from '../locale-table.svelte';
	import { Unit } from '@murithigeo/covjson-core';
	import type { Optional, MetadataRenderProps } from '../types.d.ts';
	import { RulerDimensionLineIcon, ChevronsUpDownIcon } from '@lucide/svelte';
	import { buttonVariants, Button } from '$lib/components/ui/button/index.js';

	let { data: unit = $bindable() }: Optional<MetadataRenderProps<Unit>, 'data'> = $props();
</script>

<Collapsible.Root>
	<Item.Root size="sm" variant="outline">
		<Item.Media><RulerDimensionLineIcon class="size-5" /></Item.Media>
		<Item.Content>
			<Item.Title>Unit</Item.Title>
		</Item.Content>
		<Item.Actions>
			<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })} disabled={!unit}>
				<ChevronsUpDownIcon />
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>
	{#if unit}
		<Collapsible.Content>
			{#if unit.symbol}
				<Item.Root>
					<Item.Content>
						<Item.Title lang="en"><Label>{unit.symbol.value}</Label></Item.Title>
						<Item.Description>
							{#if unit.symbol?.type}
								<a href={unit.symbol.type} rel="external">{unit.symbol.type}</a>
							{:else}
								No Serialization Scheme
							{/if}
						</Item.Description>
					</Item.Content>
				</Item.Root>
			{/if}
			<LocaleTable data={{ label: unit.label }} />
		</Collapsible.Content>
	{/if}
</Collapsible.Root>
