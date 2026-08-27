<script lang="ts">
	import type { ParameterGroup } from 'coveragejson';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import ObservedProperty from './observed-property.svelte';
	import LocaleTable from './locale-table.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { ChevronsUpDown, LanguagesIcon, EyeIcon } from '@lucide/svelte';
	import { ParameterGroup as PGroupClass } from '@murithigeo/covjson-core';
	import { buttonVariants, Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { getDashCtx } from '../dashboards/utils/ctx.svelte.ts';

	const ctx = getDashCtx();
	type Props = MetadataRenderProps<ParameterGroup | PGroupClass, { open?: boolean }>;
	let { data = $bindable(), open = $bindable(false) }: Props = $props();

	let pGroup = $derived.by(() => {
		if (data instanceof PGroupClass) return data;
		return new PGroupClass(data);
	});
	let id = $derived(pGroup.id);
	let checked = $derived(pGroup.members.every((member) => ctx.selected.has(member)));
	let indeterminate = $derived(
		!checked && pGroup.members.some((member) => ctx.selected.has(member))
	);
</script>

<Collapsible.Root bind:open>
	<Item.Root class="w-full">
		<Item.Media>
			<Checkbox
				bind:checked
				bind:indeterminate
				value={id}
				{id}
				onCheckedChange={() =>
					pGroup.members.forEach((id) => ctx.updateParameterSelectionStatus(id))}
			/>
		</Item.Media>
		<Item.Content>
			<Item.Title lang="en">{id || 'No ID'}</Item.Title>
		</Item.Content>
		<Item.Actions>
			<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}>
				<ChevronsUpDown />
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>
	<Collapsible.Content class="ml-4">
		<Card.Root>
			<Card.Content>
				<!-- Add items to toggle members -->
				<div class="flex flex-row space-x-1">
					{#each pGroup.members as member (member)}
						<Item.Root>
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
							>
						</Item.Root>
					{/each}
				</div>
				<Collapsible.Root>
					<Item.Root class="sm">
						<Item.Media><LanguagesIcon class="size-5" /></Item.Media>
						<Item.Content>
							<Item.Title lang="en">Internationalization</Item.Title>
						</Item.Content>
						<Item.Actions
							><Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}>
								<ChevronsUpDown />
							</Collapsible.Trigger></Item.Actions
						>
					</Item.Root>
					<Collapsible.Content>
						<div class="ml-5">
							<LocaleTable data={{ label: pGroup.label, description: pGroup.description }} />
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
				<Collapsible.Root disabled={!pGroup.observedProperty}>
					{#if pGroup.observedProperty}
						<ObservedProperty data={pGroup.observedProperty} />
					{/if}
				</Collapsible.Root>
			</Card.Content>
		</Card.Root>
	</Collapsible.Content>
</Collapsible.Root>
