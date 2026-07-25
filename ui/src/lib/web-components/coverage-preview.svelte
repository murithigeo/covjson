<script lang="ts">
	import * as Card from '../components/ui/card/index.ts';
	import { Coverage, type OnIndicesChange } from '@murithigeo/covjson-core';
	import type { MetadataRenderProps } from './types.d.ts';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import * as ButtonGroup from '../components/ui/button-group/index.ts';
	import { Button, buttonVariants } from '../components/ui/button/index.ts';
	import { cn } from '$lib/utils.js';
	import { type Snippet } from 'svelte';
	import { ArrowUp, ArrowLeft, ArrowDown, ArrowRight, Info } from '@lucide/svelte';
	import * as Tooltip from '../components/ui/tooltip/index.ts';
	interface Props extends MetadataRenderProps<Coverage> {
		onIndicesChange?: OnIndicesChange;
		pageWith?: 'z' | 't';
		headerChild?: Snippet<[{ coverage: Coverage }]>;
	}

	let {
		data: coverage = $bindable(),
		detail = 'simple',
		onIndicesChange,
		pageWith = $bindable('t'),
		headerChild,
		class: className
	}: Props = $props();

	/**
	 * For Grid only. Allows tiling by z/t axis such that each value has its own data
	 */
	let page = $state(1);

	/**
	 * Current indices values
	 */
	let indices = $derived(
		new SvelteMap(
			Object.entries({ ...coverage.indices, [pageWith]: page - 1 }).map(([k, v]) => [k, v])
		)
	);

	addEventListener('ontoggleParameter', (e) => console.log(e));
	// $effect(() => {
	// 	$host().dispatchEvent(
	// 		new CustomEvent('IndicesChange', {
	// 			detail: [coverage.uuid, Object.fromEntries(indices.entries())]
	// 		})
	// 	);
	// });
	let axesMaxes = $derived.by(() => {
		let maxes = new SvelteMap<'horizontal' | 'vertical', { value: number; axis: string }>();
		switch (coverage?.domain.domainType) {
			case 'Grid':
				maxes
					.set('horizontal', { axis: 'x', value: coverage?.domain.x.length })
					.set('vertical', { axis: 'y', value: coverage?.domain.y.length });
				break;
			case 'Section':
			case 'Trajectory':
			case 'MultiPoint':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
			case 'MultiPointSeries':
				maxes.set('horizontal', {
					axis: 'composite',
					value: coverage.domain.axes.composite.values.length
				});
				break;
		}
		return maxes;
	});

	function crementIndices(direction: '+' | '-', type: 'horizontal' | 'vertical') {
		let stats = axesMaxes.get(type);
		if (!stats) return;
		let { axis, value: max } = stats;
		let value = indices.get(axis)!;
		value = direction === '-' ? value - 1 : value + 1;
		if (value < 0) value = max - 1;
		if (value >= max) value = 0;
		indices.set(axis, value);
	}
	$inspect(indices);
</script>

<Card.Root class={cn(className)}>
	<Card.Header>
		{#if headerChild}
			{@render headerChild?.({ coverage })}
		{:else}
			<Card.Title>{coverage?.domainType}</Card.Title>
		{/if}
	</Card.Header>
	<Card.Root>
		<ButtonGroup.Root orientation="vertical">
			<Button
				variant="outline"
				size="icon-sm"
				class="w-full"
				onclick={() => crementIndices('+', 'vertical')}
				disabled={!axesMaxes.get('vertical')?.value}><ArrowUp /></Button
			>
			<ButtonGroup.Root class="border-t-none -mt-2">
				<Button
					variant="outline"
					size="icon-sm"
					onclick={() => crementIndices('-', 'horizontal')}
					disabled={!axesMaxes.get('horizontal')?.value}
				>
					<ArrowLeft />
				</Button>
				<Tooltip.Provider delayDuration={300}>
					<Tooltip.Root>
						<Tooltip.Trigger class={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
							><Info /></Tooltip.Trigger
						>
						<Tooltip.Content>
							<p>Use buttons to change highlighted axes values. For Grid only</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<Button
					variant="outline"
					size="icon-sm"
					onclick={() => crementIndices('+', 'horizontal')}
					disabled={!axesMaxes.get('horizontal')?.value}><ArrowRight /></Button
				>
			</ButtonGroup.Root>
			<Button
				variant="outline"
				size="icon-sm"
				class="-mt-2 w-full"
				onclick={() => crementIndices('-', 'vertical')}
				disabled={!axesMaxes.get('vertical')?.value}
			>
				<ArrowDown /></Button
			>
		</ButtonGroup.Root>
	</Card.Root>
</Card.Root>
