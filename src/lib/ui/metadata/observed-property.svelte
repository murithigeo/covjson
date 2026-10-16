<script lang="ts">
	import * as Item from '#lib/components/ui/item/index.js';
	import { ObservedProperty } from '#lib/core/index.ts';
	import { cn } from '#lib/utils.ts';
	import LocaleTable from './locale-table.svelte';
	import type { MetadataRenderProps } from './types.d.ts';

	let { data, class: className }: MetadataRenderProps<ObservedProperty> = $props();
	let label = $derived(data.label);
	let description = $derived(data.description);
</script>

<div class={cn('flex flex-col space-y-2', className)}>
	{#if description.size || label.size || data.id}
		<Item.Root>
			<Item.Content>
				<Item.Title lang={description.query()?.tag}>{data.id || label.query()?.value}</Item.Title>
				{#if description.size}
					<Item.Description lang={description.query()?.tag}
						>{description.query()?.value}</Item.Description
					>
				{/if}
			</Item.Content>
		</Item.Root>
	{/if}
	<LocaleTable data={{ label, description }} />
</div>
