<!-- A component used to change active indices of the focus coverage -->
<script lang="ts">
	import type { Coverage } from '@murithigeo/covjson-core';
	import { Button, type ButtonProps } from '../components/ui/button/index.ts';
	import * as ButtonGroup from '../components/ui/button-group/index.ts';
	import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Info } from '@lucide/svelte';
	import { SvelteMap } from 'svelte/reactivity';

	interface Props {
		domainData: Pick<InferDomainClass<T>, 'axes' | 'domainType'>;
		coverage?: Coverage; // make the indices generic
		/**
		 * For Grid coverages only.
		 * Allows visualization of 4D data values by slicing into tiles either by the "z"|"t" axes
		 */
		page?: number;
		pageWith?: 'z' | 't';
		indices: SvelteMap<string, number>;
		/**
		 * Renders the indices buttons as a grid reminiscent of a joystick
		 */
		joystick?: boolean;
	}
	let {
		domainData = $bindable(),
		page = $bindable(1),
		pageWith = 't',
		joystick = $bindable(false),
		indices = $bindable()
	}: Props = $props();

	let limits = $derived.by(() => {
		// How many components are there in the axis
		let limits = new SvelteMap<'horizontal' | 'vertical', { value: number; axis: string }>();
		switch (coverage?.domain.domainType) {
			case 'Grid':
				limits
					.set('horizontal', { axis: 'x', value: coverage.domain.axesStats.get('x')! })
					.set('vertical', { axis: 'y', value: coverage.domain.axesStats.get('y')! });
				break;
			case 'Polygon':
			case 'PolygonSeries':
			case 'MultiPoint':
			case 'MultiPointSeries':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
				limits.set('horizontal', {
					axis: 'composite',
					value: coverage.domain.axesStats.get('composite')!
				});
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
</script>

{#if joystick}
	<ButtonGroup.Root orientation="vertical">
		{@render up()}
		<ButtonGroup.Root>
			{@render left()}
			<Button {...buttonProps}><Info /></Button>
			{@render right()}
		</ButtonGroup.Root>
		{@render down()}
	</ButtonGroup.Root>
{:else}
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
{/if}

{#snippet right()}
	<Button
		{...buttonProps}
		onclick={() => crementIndices('+', 'horizontal')}
		disabled={!limits.get('horizontal')?.value}
	>
		<ArrowRight />
	</Button>
{/snippet}

{#snippet left()}
	<Button
		{...buttonProps}
		onclick={() => crementIndices('-', 'horizontal')}
		disabled={!limits.get('horizontal')?.value}
	>
		<ArrowLeft />
	</Button>
{/snippet}

{#snippet up()}
	<Button
		{...buttonProps}
		onclick={() => crementIndices('+', 'vertical')}
		disabled={!limits.get('vertical')?.value}
	>
		<ArrowUp />
	</Button>
{/snippet}

{#snippet down()}
	<Button
		{...buttonProps}
		onclick={() => crementIndices('-', 'vertical')}
		disabled={!limits.get('vertical')?.value}
	>
		<ArrowDown />
	</Button>
{/snippet}
