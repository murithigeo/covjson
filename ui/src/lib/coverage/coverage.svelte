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
		FocusIcon,
		TrashIcon,
		PinIcon,
		PinOffIcon,
		MousePointer2Icon
	} from '@lucide/svelte';
	import { Toggle } from '$lib/components/ui/toggle/index.js';
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import { Coverage, indexOfNearest } from '@murithigeo/covjson-core';
	import { Label } from '$lib/components/ui/label/index.js';
	import Chart from './chart.svelte';
	import { setCoverageCtx } from './coverage-ctx.svelte.ts';
	import { getDashCtx } from '../dashboards/utils/ctx.svelte.ts';
	import type { SliderIndex, StringSliderValue } from '$lib/sliders/sliders.d.ts';
	interface Props {
		coverage: Coverage;
	}
	const buttonProps: ButtonProps = { variant: 'outline', size: 'icon-sm' };
	let { coverage = $bindable() }: Props = $props();
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
</script>

<Card.Root class="h-full w-full">
	<Card.Header>
		<Card.Title
			>{coverage.id || 'No ID Available'}
			<Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title
		>
		<Card.Description class="flex flex-row space-x-2">
			{#each coverage.axesSize as [axisName, size] (axisName)}
				<Label
					><Badge variant="outline">{axisName}</Badge>{covCtx.indices.get(axisName) || 1}/{size -
						1}</Label
				>
			{/each}
		</Card.Description>
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
				{...buttonProps}
			>
				<TrashIcon /></Button
			>
			<Toggle
				aria-label="Select Coverage"
				class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-yellow-500 data-[state=on]:*:[svg]:stroke-yellow-500"
				size="sm"
				variant="outline"
				pressed={ctx.currentCoverage?.uuid === coverage.uuid}
				onPressedChange={ctx.setCurrentCoverage(coverage)}><MousePointer2Icon /></Toggle
			>
			<!-- <ButtonGroup.Root>
				<Button
					onclick={() => ctx.setCurrentCoverage(coverage)}
					class="rounded-full"
					{...buttonProps}><FocusIcon /></Button
				>
				<Button
					onclick={() => ctx.updateCoveragePinStatus(coverage.uuid)}
					class="rounded-full"
					{...buttonProps}
				>
					{#if ctx.pinned.has(coverage.uuid)}
						<PinOffIcon />
					{:else}
						<PinIcon />
					{/if}
				</Button>
				<Button
					onclick={() => ctx.trashCoverage(coverage.uuid)}
					disabled={ctx.pinned.has(coverage.uuid)}
					{...buttonProps}
				>
					<TrashIcon /></Button
				>
			</ButtonGroup.Root> -->
		</Card.Action>
	</Card.Header>
	<Card.Content class="w-full">
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
