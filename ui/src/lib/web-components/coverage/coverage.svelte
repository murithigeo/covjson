<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { type ChartConfig } from '$lib/components/ui/chart/index.js';
	import { TrashIcon, PinIcon, PinOffIcon } from '@lucide/svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import { Coverage } from '@murithigeo/covjson-core';
	import Chart from './chart.svelte';
	import { setCoverageCtx } from './coverage-ctx.svelte.ts';
	import { getDashCtx } from '../dashboards/ctx.svelte.ts';
	import TemporalControl from './temporal.svelte';
	interface Props {
		coverage: Coverage;
	}
	const buttonProps: ButtonProps = { variant: 'outline', size: 'icon-sm' };
	let { coverage = $bindable() }: Props = $props();
	setCoverageCtx(coverage);
	const ctx = getDashCtx();
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title
			>{coverage.id || 'No ID Available'}
			<Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title
		>
		<Card.Description></Card.Description>
		<Card.Action>
			<ButtonGroup.Root>
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
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Chart bind:coverage />
	</Card.Content>
	<Card.Footer>
		<TemporalControl {buttonProps}></TemporalControl>
	</Card.Footer>
</Card.Root>
