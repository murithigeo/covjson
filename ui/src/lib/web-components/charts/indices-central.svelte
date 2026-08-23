<script lang="ts">
	import { indexOfNearest, isUndefined } from '@murithigeo/covjson-core';
	import { ArrowLeftIcon, ArrowUpIcon, ArrowRightIcon, ArrowDownIcon } from '@lucide/svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { DomainTypes } from 'coveragejson';
	import TemporalControl from '../sliders/temporal-control.svelte';
	import { type ButtonProps, Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	interface Props {
		indices: SvelteMap<string, number>;
		axesSize: Map<string, number>;
		domainType: DomainTypes;
		/**
		 * Current global t value
		 */
		t?: string;
		/**
		 * Coverage's t values
		 */
		tvalues: SvelteSet<string>;
		class?: ClassValue;
	}

	let {
		indices = $bindable(),
		axesSize = $bindable(),
		domainType = $bindable(),
		t = $bindable(),
		tvalues = $bindable(),
		class: className
	}: Props = $props();

	let limits = $derived.by(() => {
		const limits = new SvelteMap<'horizontal' | 'vertical', { value: number; axis: string }>();
		switch (domainType) {
			case 'Grid':
				limits
					.set('horizontal', { axis: 'x', value: axesSize.get('x') || 0 })
					.set('vertical', { axis: 'y', value: axesSize.get('y') || 0 });
				break;
			case 'Polygon':
			case 'PolygonSeries':
			case 'MultiPoint':
			case 'MultiPointSeries':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
				limits.set('horizontal', { axis: 'composite', value: axesSize.get('composite') || 0 });
				break;
		}
		return limits;
	});
	let buttonProps: ButtonProps = {};
	function crementIndices(operator: '+' | '-', direction: 'vertical' | 'horizontal') {
		const stats = limits.get(direction);
		if (!stats) return;
		let { axis, value: max } = stats;
		let currentIndex = indices?.get(axis)!;
		if (operator === '+') currentIndex += 1;
		else currentIndex -= 1;
		currentIndex = (currentIndex + max) % max;
		indices?.set(axis, currentIndex);
	}

	// function updateTemporalIndex(index: number) {
	// 	switch (domainType) {
	// 		case 'Trajectory':
	// 		case 'Section':
	// 			indices.set('composite', index);
	// 			break;
	// 		default:
	// 			indices.set('t', index);
	// 	}
	// }
	$effect(() => {
		switch (domainType) {
			case 'Section':
			case 'Trajectory':
				indices.set('composite', tIndex);
				break;
			default:
				indices.set('t', tIndex);
		}
	});
	let tIndex = $state(0);
	const syncTemporal = (t?: string) => {
		if (isUndefined(t)) return;
		const asEpoch = tvalues
			.keys()
			.map((t) => new Date(t).getTime())
			.toArray();
		const bestMatch = indexOfNearest(asEpoch, new Date(t).getTime());
		console.log({ t, bestMatch });
		if (bestMatch > -1) tIndex = bestMatch;
		// console.log({bestmatch})
	};
	$effect(() => syncTemporal(t));

	$inspect({ t, tIndex });
</script>

<TemporalControl
	bind:values={tvalues}
	// onIndexChange={updateTemporalIndex}
	class={cn(className)}
	bind:index={tIndex}
>
	{#snippet children()}
		<ButtonGroup.Root>
			<ButtonGroup.Root orientation="horizontal">
				{@render left()}
				{@render right()}
			</ButtonGroup.Root>
			<ButtonGroup.Root orientation="horizontal">
				{@render up()}
				{@render down()}
			</ButtonGroup.Root>
		</ButtonGroup.Root>
	{/snippet}
</TemporalControl>
{#snippet right()}
	<Button
		{...buttonProps}
		onclick={() => crementIndices('+', 'horizontal')}
		disabled={!limits.get('horizontal')?.value}
	>
		<ArrowRightIcon />
	</Button>
{/snippet}

{#snippet left()}
	<Button
		{...buttonProps}
		onclick={() => crementIndices('-', 'horizontal')}
		disabled={!limits.get('horizontal')?.value}
	>
		<ArrowLeftIcon />
	</Button>
{/snippet}

{#snippet up()}
	<Button
		{...buttonProps}
		onclick={() => crementIndices('+', 'vertical')}
		disabled={!limits.get('vertical')?.value}
	>
		<ArrowUpIcon />
	</Button>
{/snippet}

{#snippet down()}
	<Button
		{...buttonProps}
		onclick={() => crementIndices('-', 'vertical')}
		disabled={!limits.get('vertical')?.value}
	>
		<ArrowDownIcon />
	</Button>
{/snippet}
