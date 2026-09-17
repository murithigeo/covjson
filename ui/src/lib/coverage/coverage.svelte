<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import TemporalSlider from '$lib/sliders/temporal-control.svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { SvelteMap } from 'svelte/reactivity';
	import {
		ArrowLeftIcon,
		ArrowRightIcon,
		ArrowUpIcon,
		ArrowDownIcon,
		TrashIcon,
		PinIcon
	} from '@lucide/svelte';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import { Coverage, indexOfNearest } from '@murithigeo/covjson-core';
	import Chart from '$lib/charts/coverage.svelte';
	import { setCoverageCtx } from './coverage-ctx.svelte.ts';
	import { getDashCtx } from '../dashboards/utils/ctx.svelte.ts';
	import type { SliderIndex, StringSliderValue } from '$lib/sliders/sliders.d.ts';
	interface Props {
		coverage: Coverage;
		checked?: boolean;
	}
	const buttonProps: ButtonProps = { variant: 'outline', size: 'icon-sm' };
	let { coverage = $bindable(), checked = $bindable(false) }: Props = $props();
	const ctx = getDashCtx();
	const covCtx = setCoverageCtx(coverage);

	let tvalues = $derived(coverage.t);
	let index = $derived<SliderIndex>([0, 0, Math.abs(tvalues.length - 1)]);

	function updateLocalTemporalIndices(now?: StringSliderValue): void {
		if (!now) return;
		const tAsEpoch = tvalues.map((v) => new Date(v).getTime());
		index = now
			.map((v) => new Date(v).getTime())
			.map((t) => indexOfNearest(tAsEpoch, t)) as SliderIndex;
	}
	$effect(() => updateLocalTemporalIndices(ctx.now));
	$effect(() => {
		covCtx.indices = new SvelteMap([...coverage.indices]);
	});
	$effect(() => ctx.setCurrentCoverage(coverage)(checked));
</script>

<Card.Root
	class="cursor-pointer border data-checked:border-green-600"
	onclick={() => (checked = !checked)}
	data-checked={checked}
>
	<Card.Header>
		<Card.Title>
			<Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title
		>
		<Card.Description class="flex flex-row space-x-2"></Card.Description>
		<Card.Action>
			<Toggle
				aria-label="Pin Coverage"
				class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-yellow-500 data-[state=on]:*:[svg]:stroke-yellow-500"
				pressed={ctx.pinned.has(coverage.uuid)}
				onPressedChange={ctx.updateCoveragePinStatus(coverage)}
				size="sm"
				variant="outline"
			>
				<PinIcon />
			</Toggle>
			<Button
				onclick={() => ctx.trashCoverage(coverage.uuid)}
				disabled={ctx.pinned.has(coverage.uuid)}
				size="icon-sm"
				{...buttonProps}
			>
				<TrashIcon /></Button
			>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Chart bind:coverage />
	</Card.Content>
	<Card.Footer>
		<TemporalSlider
			bind:index
			values={coverage.t}
			{buttonProps}
			onIndexChange={({ index: [, index] }) => covCtx.updateTemporalIndex(index)}
		>
			{#snippet children()}
				<ButtonGroup.Root>
					<Button
						{...buttonProps}
						onclick={() => covCtx.crementIdx('-', 'horizontal')}
						disabled={(covCtx.limits.get('horizontal')?.value || 0) < 2}
						><ArrowLeftIcon />
					</Button>
					<Button
						{...buttonProps}
						onclick={() => covCtx.crementIdx('+', 'horizontal')}
						disabled={(covCtx.limits.get('horizontal')?.value || 0) < 2}
					>
						<ArrowRightIcon />
					</Button>
					<Button
						{...buttonProps}
						onclick={() => covCtx.crementIdx('+', 'vertical')}
						disabled={(covCtx.limits.get('vertical')?.value || 0) < 2}
					>
						<ArrowUpIcon />
					</Button>
					<Button
						{...buttonProps}
						onclick={() => covCtx.crementIdx('-', 'vertical')}
						disabled={(covCtx.limits.get('vertical')?.value || 0) < 2}
					>
						<ArrowDownIcon />
					</Button>
				</ButtonGroup.Root>
			{/snippet}
		</TemporalSlider>
	</Card.Footer>
</Card.Root>
