<script lang="ts">
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import ObservedProperty from './observed-property.svelte';
	import LocaleTable from './locale-table.svelte';
	import * as Item from '#lib/components/ui/item/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import { ChevronsUpDown, LanguagesIcon } from '@lucide/svelte';
	import { ParameterGroup } from '#lib/core/index.ts';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import type { MetadataRenderProps, OnChangeFn } from './types.d.ts';

	interface Props extends MetadataRenderProps<ParameterGroup> {
		open?: boolean;
		onCheckedChange?: OnChangeFn<string[], boolean>;
		checked?: boolean;
		selected?: Set<string>;
	}
	let {
		data = $bindable(),
		open = $bindable(false),
		selected = $bindable(),
		onCheckedChange
	}: Props = $props();

	let checked = $derived(data.members.every((member) => selected?.has(member)));
	let indeterminate = $derived(!checked && data.members.some((member) => selected?.has(member)));
</script>

<Collapsible.Root bind:open>
	<Item.Root class="w-full" size="sm" variant="outline">
		<Item.Media>
			<Checkbox
				bind:checked
				bind:indeterminate
				onCheckedChange={(checked) => onCheckedChange?.(data.members, checked)}
			/>
		</Item.Media>
		<Item.Content>
			<Item.Title lang="en">{data.id || 'No ID'}</Item.Title>
		</Item.Content>
		<Item.Actions>
			<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}>
				<ChevronsUpDown />
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>
	<Collapsible.Content>
		<Card.Root>
			<Card.Content>
				<!-- Add items to toggle members -->
				<ButtonGroup.Root>
					{#each data.members as member (member)}
						<!-- <Item.Root>
							<Item.Media>
								<Checkbox
									checked={ctx.selected.has(member)}
									onCheckedChange={() => ctx.updateParameterSelectionStatus(member)}
								/>
							</Item.Media>
							<Item.Content><Item.Title>{member}</Item.Title></Item.Content>
							<Item.Actions
								><Button
									size="icon-sm"
									variant="outline"
									onclick={() => {
										document
											.getElementById(`parameter:${member}`)
											?.scrollIntoView({ block: 'center', behavior: 'smooth' });
									}}><EyeIcon /></Button
								></Item.Actions
							> -->
					{/each}
				</ButtonGroup.Root>
				<Collapsible.Root>
					<Item.Root size="sm" variant="outline">
						<Item.Media variant="icon"><LanguagesIcon /></Item.Media>
						<Item.Content>
							<Item.Title lang="en">Internationalization</Item.Title>
						</Item.Content>
						<Item.Actions
							><Collapsible.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
								<ChevronsUpDown />
							</Collapsible.Trigger></Item.Actions
						>
					</Item.Root>
					<Collapsible.Content class="ml-5">
						<LocaleTable data={{ label: data.label, description: data.description }} />
					</Collapsible.Content>
				</Collapsible.Root>
				<Collapsible.Root disabled={!data.observedProperty}>
					{#if data.observedProperty}
						<ObservedProperty data={data.observedProperty} />
					{/if}
				</Collapsible.Root>
			</Card.Content>
		</Card.Root>
	</Collapsible.Content>
</Collapsible.Root>
