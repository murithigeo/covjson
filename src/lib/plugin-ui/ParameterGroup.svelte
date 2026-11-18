<svelte:options customElement={{ tag: 'covjson-parametergroup', shadow: 'none' }} />

<script lang="ts">
	import ObservedProperty from './metadata/observed-property.svelte';
	import LocaleTable from './metadata/locale-table.svelte';
	import * as Accordion from '#lib/components/ui/accordion/index.js';
	import { ParameterGroup } from '#lib/core/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import css from '../../routes/layout.css?inline';
	interface Props {
		data: ParameterGroup;
	}

	let { data }: Props = $props();
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title>{data.id || data.label.query()?.value || 'No Id Available'}</Card.Title>
		<Card.Description>
			{#each data.members as member, i (i)}<Badge variant="outline">{member}</Badge
				>{/each}</Card.Description
		>
	</Card.Header>
	<Card.Content>
		<Accordion.Root type="multiple" value={['internationalization', 'observedProperty']}>
			<Accordion.Item value="i18n">
				<Accordion.Trigger>Internationalization</Accordion.Trigger>
				<Accordion.Content>
					<LocaleTable data={{ label: data.label, description: data.description }} />
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="observedProperty" disabled={!data.observedProperty}>
				<Accordion.Trigger>Observed Property</Accordion.Trigger>
				<Accordion.Content>
					{#if data.observedProperty}
						<ObservedProperty data={data.observedProperty} />
					{/if}
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</Card.Content>
</Card.Root>
<svelte:element this={'style'}>{css}</svelte:element>
