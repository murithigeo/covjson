<script lang="ts">
	import TemporalControl from '../sliders/temporal-control.svelte';
	import { Coverage } from '@murithigeo/covjson-core';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { ArrowLeftIcon, ArrowRightIcon, ArrowDownIcon, ArrowUpIcon } from '@lucide/svelte';
	interface Props {
		now?: string;
		coverage: Coverage;
		indices?: SvelteMap<string, number>;
	}

	let { now = $bindable(), coverage = $bindable(), indices = $bindable() }: Props = $props();

	let limits = $derived.by(() => {
		const limits = new SvelteMap<'horizontal' | 'vertical', { value: number; axis: string }>();
		switch (coverage.domain.domainType) {
			case 'Grid':
				limits
					.set('horizontal', {
						axis: 'x',
						value: coverage.axesSize.get('x') || 0
					})
					.set('vertical', {
						axis: 'x',
						value: coverage.axesSize.get('x') || 0
					});
			case 'Polygon':
			case 'PolygonSeries':
			case 'MultiPoint':
			case 'MultiPointSeries':
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
				limits.set('horizontal', {
					axis: 'composite',
					value: coverage.axesSize.get('composite') || 0
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
	const onTemporalSliderIndexChange = (index: number) => {
		switch (coverage.domainType) {
			case 'Trajectory':
			case 'Section':
				indices.set('composite', index);
				break;
			default:
				indices.set('t', index);
		}
	};
</script>

<TemporalControl values={coverage.t} onIndexChange={onTemporalSliderIndexChange} bind:now>
	{#snippet children()}
		<ButtonGroup.Root>
			<Button
				{...buttonProps}
				onclick={() => crementIndices('-', 'horizontal')}
				disabled={limits.get('horizontal')?.value < 2}
				><ArrowLeftIcon />
			</Button>
			<Button
				{...buttonProps}
				onclick={() => crementIndices('+', 'horizontal')}
				disabled={limits.get('horizontal')?.value < 2}
			>
				<ArrowRightIcon />
			</Button>
			<Button
				{...buttonProps}
				onclick={() => crementIndices('+', 'vertical')}
				disabled={!limits.get('vertical')?.value}
			>
				<ArrowUpIcon />
			</Button>
			<Button
				{...buttonProps}
				onclick={() => crementIndices('-', 'vertical')}
				disabled={!limits.get('vertical')?.value}
			>
				<ArrowDownIcon />
			</Button>
		</ButtonGroup.Root>
	{/snippet}
</TemporalControl>
