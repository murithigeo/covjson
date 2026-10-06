<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { ObservedProperty } from '#lib/core/index.ts';
	import LocaleTable from './locale-table.svelte';
	import type { MetadataRenderProps } from './types.d.ts';

	let { data: obs }: MetadataRenderProps<ObservedProperty> = $props();
	let label = $derived(obs.label);
	let description = $derived(obs.description);
</script>

<Card.Root>
	<Card.Header>
		{@const l = label?.query()}
		{@const d = description?.query()}
		<Card.Title lang={l?.tag}>
			{obs.id || l?.value || 'No Id Provided'}
		</Card.Title>
		<Card.Description lang={d?.tag}>
			<Label>{d?.value || 'No Description found'}</Label>
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<LocaleTable
			data={{
				description,
				label
			}}
		/>
	</Card.Content>
</Card.Root>
