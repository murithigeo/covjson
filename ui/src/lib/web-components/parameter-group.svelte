<script lang="ts">
	import type { MetadataRenderProps } from './types.d.ts';
	import type { ParameterGroup } from 'coveragejson';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import ObservedProperty from './observed-property.svelte';
	import LocaleTable from './locale-table.svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { ChevronsUpDown, LanguagesIcon } from '@lucide/svelte';
	import { ParameterGroup as PGroupClass } from '@murithigeo/covjson-core';
	import { SvelteSet } from 'svelte/reactivity';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	interface Props extends MetadataRenderProps<PGroupClass | ParameterGroup> {
		selected?: SvelteSet<string>;
		open?: boolean;
	}
	let {
		data = $bindable(),
		detail,
		open = $bindable(false),
		selected = $bindable()
	}: Props = $props();
	let pGroup = $derived.by(() => {
		if (data instanceof PGroupClass) return data;
		return new PGroupClass(data);
	});
	let id = $derived(pGroup.id);
	let checked = $derived(pGroup.members.every((member) => selected?.has(member)));
	let indeterminate = $derived(!checked && pGroup.members.some((member) => selected?.has(member)));

	const unselect = (id: string) => selected?.delete(id);
	const select = (id: string) => selected?.add(id);

	const onCheckedChange = (checked: boolean, id?: string) => {
		const ex = checked ? select : unselect;
		if (id !== undefined) return ex(id);
		pGroup.members.forEach(ex);
	};
</script>

<Collapsible.Root bind:open>
	<Item.Root class="w-full">
		<Item.Media>
			<Checkbox bind:checked bind:indeterminate value={id} {id} {onCheckedChange} />
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
									checked={selected?.has(member)}
									onCheckedChange={(checked) => onCheckedChange(checked, member)}
								/>
							</Item.Media>
							<!-- Use scrollTo instead -->
							<Item.Content><Item.Title>{member}</Item.Title></Item.Content>
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
							<LocaleTable
								data={{ label: pGroup.label, description: pGroup.description }}
								{detail}
							/>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
				<Collapsible.Root disabled={!pGroup.observedProperty}>
					{#if pGroup.observedProperty}
						<ObservedProperty data={pGroup.observedProperty} {detail} />
					{/if}
				</Collapsible.Root>
			</Card.Content>
		</Card.Root>
	</Collapsible.Content>
</Collapsible.Root>
