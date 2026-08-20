<script lang="ts">
	import { ArrowLeftIcon, ArrowUpIcon, ArrowRightIcon, ArrowDownIcon } from '@lucide/svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { DomainTypes } from 'coveragejson';
	import TemporalControl from '../temporal-control.svelte';
	import { type ButtonProps, Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';
	interface Props {
		indices: SvelteMap<string, number>;
		axesCount: Map<string, number>;
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
		axesCount = $bindable(),
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
					.set('horizontal', { axis: 'x', value: axesCount.get('x') || 0 })
					.set('vertical', { axis: 'y', value: axesCount.get('y') || 0 });
				break;
			case 'Polygon':
			case 'PolygonSeries':
			case 'MultiPoint':
			case 'MultiPointSeries':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
				limits.set('horizontal', { axis: 'composite', value: axesCount.get('composite') || 0 });
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

	// let tNum = $derived.by<number | undefined>(() => {
	// 	switch (domainType) {
	// 		case 'Section':
	// 		case 'Trajectory':
	// 			return axesCount.get('composite');
	// 		default:
	// 			return axesCount.get('t');
	// 	}
	// });
	/**
	 * Synchronize the global t value with coverage t value
	 * For Section, then changing the value of t should also change active node
	 */
	function syncT() {}
	function updateTemporalIndex(index: number) {
		switch (domainType) {
			case 'Trajectory':
			case 'Section':
				indices.set('composite', index);
				break;
			default:
				indices.set('t', index);
		}
	}
</script>

<TemporalControl bind:values={tvalues} onIndexChange={updateTemporalIndex} class={cn(className)}>
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
