<script lang="ts">
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import ObservedProperty from './observed-property.svelte';
	import LocaleTable from './locale-table.svelte';
	import * as Accordion from '#lib/components/ui/accordion/index.js';
	import { ParameterGroup } from '#lib/core/index.ts';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import type { MetadataRenderProps } from './types';

	interface Props extends MetadataRenderProps<ParameterGroup> {
		selected?: Set<string>;
		checkable?: boolean;
	}
	let { data = $bindable(), selected = $bindable(), checkable = $bindable() }: Props = $props();

	let checked = $derived(data.members.every((member) => selected?.has(member)));
	let indeterminate = $derived(!checked && data.members.some((member) => selected?.has(member)));
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title>{data.id || data.label.query()?.value || 'No Id Available'}</Card.Title>
		{#if checkable}
			<Card.Action>
				<Checkbox
					bind:checked
					bind:indeterminate
					onCheckedChange={(checked) =>
						data.members.forEach((id) => (checked ? selected?.add(id) : selected?.delete(id)))}
				/>
			</Card.Action>
		{/if}
	</Card.Header>
	<Card.Content>
		<Accordion.Root type="multiple" value={['members']}>
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

			<Accordion.Item value="members">
				<Accordion.Trigger>Members</Accordion.Trigger>
				<Accordion.Content>
					<ButtonGroup.Root>
						{#each data.members as member (member)}
							<ButtonGroup.Root>
								<Button
									size="xs"
									variant="outline"
									onclick={() => {
										document
											.getElementById(`parameter-${member}`)
											?.scrollIntoView({ block: 'center', behavior: 'smooth' });
									}}>{member}</Button
								>
								<Checkbox
									onCheckedChange={(checked) => {
										if (checked) selected?.add(member);
										else selected?.delete(member);
									}}
									checked={selected?.has(member)}
									class="size-6"
								/>
							</ButtonGroup.Root>
						{/each}
					</ButtonGroup.Root>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</Card.Content>
</Card.Root>

<!-- <Item.Actions
								><Button
									size="icon-sm"
									variant="outline"
									onclick={() => {
										
									}}><EyeIcon /></Button
								></Item.Actions> -->
