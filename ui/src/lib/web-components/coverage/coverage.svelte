<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { TrashIcon, PinIcon, PinOffIcon } from '@lucide/svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { SvelteMap } from 'svelte/reactivity';
	import Chart from './chart.svelte';
	import Indices from './indices.svelte';
	interface Props {
		coverage: Coverage;
		onIndicesChange?: OnIndicesChange;
		rangeMinMaxes?: SvelteMap<string, MinMax>;
		/**
		 * The current global temporal value
		 */
		now?: string;
		pinned?: SvelteMap<string, Coverage>;
		/**
		 * All coverages rendered
		 */
		list?: SvelteMap<string, Coverage>;
	}

	let {
		coverage = $bindable(),
		onIndicesChange,
		rangeMinMaxes = $bindable(),
		now = $bindable(),
		pinned = $bindable(),
		list = $bindable(),
		onTrashCoverage
	}: Props = $props();

	let indices = $state(new SvelteMap(coverage.indices));
	const handlePin = () => {
		if (pinned?.has(coverage.uuid)) pinned.delete(coverage.uuid);
		else pinned?.set(coverage.uuid, coverage);
	};
	const trashCoverage = () => {
		pinned?.delete(coverage.uuid);
		list.delete(coverage.uuid);
	};
</script>

<Card.Root>
	<Card.Header>
		<Card.Action>
			<ButtonGroup.Root>
				<Button onclick={handlePin}>
					{#if pinned?.has(coverage.uuid)}
						<PinOffIcon />
					{:else}
						<PinIcon />
					{/if}
				</Button>
				<Button onclick={trashCoverage}><TrashIcon /></Button>
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Chart bind:coverage bind:indices bind:rangeMinMaxes />
	</Card.Content>
	<Card.Footer>
		<Indices bind:indices bind:now bind:coverage />
	</Card.Footer>
</Card.Root>
