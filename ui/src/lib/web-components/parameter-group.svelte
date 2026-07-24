<svelte:options customElement="parameter-group" />

<script lang="ts">
	import type {
		MetadataRenderProps,
		MetadataRenderDetail,
		ParameterToggleEventDetail
	} from './types.d.ts';
	import { Checkbox } from '../components/ui/checkbox/index.ts';
	import ObservedProperty from './observed-property.svelte';
	import {
		ObservedProperty as ObsClass,
		ParameterGroup as PGroupClass
	} from '@murithigeo/covjson-core';
	import { Button } from '../components/ui/button/index.ts';
	import * as ButtonGroup from '../components/ui/button-group/index.ts';
	import * as Card from '../components/ui/card/index.ts';
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	interface Props extends MetadataRenderProps<PGroupClass> {
		observedPropertyChild?: Snippet<[{ data: ObsClass; detail?: MetadataRenderDetail }]>;
	}
	let { data = $bindable(), class: className, observedPropertyChild, detail }: Props = $props();
	let pGroup = $derived.by(() => {
		if (data instanceof PGroupClass) return data;
		return new PGroupClass(data);
	});
	let selected = $derived(new SvelteSet(pGroup.members));

	let checked = $derived(pGroup.members.every((member) => selected.has(member)));
	let indeterminate = $derived(!checked && pGroup.members.some((member) => selected.has(member)));

	const dispatch = () => {
		const event = new CustomEvent<ParameterToggleEventDetail>('toggle-parameter', {
			detail: pGroup.members.reduce((l, r) => ({ ...l, [r]: selected.has(r) }), {})
		});
		$host().dispatchEvent(event);
	};
	$effect(() => dispatch());
	const unselect = (id: string) => selected?.delete(id);
	const select = (id: string) => selected?.add(id);

	const onCheckedChange = (checked: boolean, id?: string) => {
		const ex = checked ? select : unselect;
		if (id !== undefined) return ex(id);
		pGroup.members.forEach(ex);
	};
</script>

<Card.Root class={[className]}>
	<Card.Header>
		<Card.Title>{pGroup.id || 'No Id provided'}</Card.Title>
	</Card.Header>
	<Card.Action>
		<Checkbox {checked} {indeterminate} {onCheckedChange} />
	</Card.Action>
	<Card.Content>
		<!-- Add localization table, autoscroll to this observedProperty if listed member parameters do not have the observedProperty -->
		{#if pGroup.observedProperty}
			{#if observedPropertyChild}
				{@render observedPropertyChild({ data: pGroup.observedProperty, detail })}
			{:else}
				<ObservedProperty data={pGroup.observedProperty} {detail} />
			{/if}
		{/if}
	</Card.Content>
	<Card.Footer class="flex w-full flex-col items-center gap-2">
		<h4>Select parameters to visualize</h4>
		<div class="flex flex-row items-center gap-2">
			<ButtonGroup.Root>
				{#each pGroup.members as member (member)}
					<ButtonGroup.Root class="flex flex-row items-center gap-2">
						<Button variant="outline" class="uppercase" size="sm" href="#param:{member}"
							>{member}</Button
						>
						<Button variant="outline" class="icon-sm">
							<Checkbox
								onCheckedChange={(checked) => onCheckedChange(checked, member)}
								checked={selected?.has(member)}
							/>
						</Button>
					</ButtonGroup.Root>
				{/each}
			</ButtonGroup.Root>
		</div>
	</Card.Footer>
</Card.Root>
