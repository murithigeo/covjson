<script lang="ts">
	import type { MetadataRenderProps } from './types.d.ts';
	import type { ParameterGroup } from 'coveragejson';
	import { Checkbox } from '../components/ui/checkbox/index.ts';
	import ObservedProperty from './observed-property.svelte';
	import LocaleTable from './locale-table.svelte';
	import * as Field from '../components/ui/field/index.ts';
	import * as Item from '../components/ui/item/index.ts';
	import * as Collapsible from '../components/ui/collapsible/index.ts';
	import { ChevronsUpDown, LanguagesIcon } from '@lucide/svelte';
	import { ParameterGroup as PGroupClass } from '@murithigeo/covjson-core';
	import { SvelteSet } from 'svelte/reactivity';
	import { buttonVariants } from '../components/ui/button/index.ts';
	interface Props extends MetadataRenderProps<PGroupClass | ParameterGroup> {
		selected?: SvelteSet<string>;
	}
	let { data = $bindable(), detail, selected = $bindable() }: Props = $props();
	let pGroup = $derived.by(() => {
		if (data instanceof PGroupClass) return data;
		return new PGroupClass(data);
	});
	let id = $derived(pGroup.id || pGroup.members.join('/'));
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

<Collapsible.Root>
	<Field.Field orientation="horizontal">
		<Checkbox bind:checked bind:indeterminate value={id} {id} {onCheckedChange} />
		<Field.Label for={id}>{id}</Field.Label>
		<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}
			><ChevronsUpDown /></Collapsible.Trigger
		>
	</Field.Field>
	<Collapsible.Content>
		<Field.Group>
			<Field.Set class="ml-5">
				<Field.Description>Parameters in this Group</Field.Description>
				<Field.Group class="gap-3">
					{#each pGroup.members as member (member)}
						{@const id = `pgroup:${member}`}
						<Field.Field orientation="horizontal">
							<Checkbox
								onCheckedChange={(checked) => onCheckedChange(checked, member)}
								{id}
								checked={selected?.has(member)}
							/>
							<Field.Label for={id}>{member}</Field.Label>
						</Field.Field>
					{/each}
				</Field.Group>
			</Field.Set>
		</Field.Group>
		<Collapsible.Root disabled={false} class="border">
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
					<LocaleTable data={{ label: pGroup.label, description: pGroup.description }} {detail} />
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
		<Collapsible.Root disabled={!pGroup.observedProperty}>
			{#if pGroup.observedProperty}
				<ObservedProperty data={pGroup.observedProperty} {detail} />
			{/if}
		</Collapsible.Root>
	</Collapsible.Content>
</Collapsible.Root>
