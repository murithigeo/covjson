<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { type ChartConfig } from '$lib/components/ui/chart/index.js';
	import { TrashIcon, PinIcon, PinOffIcon } from '@lucide/svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { Coverage, type OnIndicesChange, type MinMax } from '@murithigeo/covjson-core';
	import Chart from './chart.svelte';
	import Indices from './indices.svelte';

	interface Props {
		chartConfig: ChartConfig;
		coverage: Coverage;
		/**
		 *
		 */
		selected?: SvelteSet<string>;
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
		selected = $bindable(),
		chartConfig = $bindable()
	}: Props = $props();

	let indices = $state(new SvelteMap(coverage.indices));
	$effect(() => onIndicesChange?.(coverage, new Map(indices)));
	const handlePin = () => {
		if (pinned?.has(coverage.uuid)) pinned.delete(coverage.uuid);
		else pinned?.set(coverage.uuid, coverage);
	};

	const trashCoverage = () => {
		pinned?.delete(coverage.uuid);
		list?.delete(coverage.uuid);
	};
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title>{coverage.id || 'No ID Available'}</Card.Title>
		<Card.Description>
			<Badge variant="outline">{coverage.domain.domainType}</Badge>
		</Card.Description>
		<Card.Action>
			<ButtonGroup.Root>
				<Button onclick={handlePin} class="rounded-full">
					{#if pinned?.has(coverage.uuid)}
						<PinOffIcon />
					{:else}
						<PinIcon />
					{/if}
				</Button>
				<Button onclick={trashCoverage} disabled={pinned?.has(coverage.uuid)} class="rounded-full"
					><TrashIcon /></Button
				>
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Chart bind:coverage bind:indices bind:rangeMinMaxes bind:selected bind:config={chartConfig} />
	</Card.Content>
	<Card.Footer>
		<Indices bind:indices bind:now bind:coverage />
	</Card.Footer>
</Card.Root>
