<script lang="ts">
	import { getDashCtx } from '$lib/web-components/dashboards/ctx.svelte.js';
	import { getCoverageCtx } from '$lib/web-components/coverage/coverage-ctx.svelte.js';
	import TemporalSlider from '$lib/web-components/sliders/temporal-control.svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import { indexOfNearest, isUndefined } from '@murithigeo/covjson-core';
	import { ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, ArrowDownIcon } from '@lucide/svelte';

	interface Props {
		buttonProps: ButtonProps;
	}
	let { buttonProps }: Props = $props();
	const ctx = getDashCtx();
	const covCtx = getCoverageCtx();
	let values = $derived(covCtx.coverage?.t);
	$inspect({ values, now: ctx.now });
	$effect(() => {
		if (!isUndefined(values) && !isUndefined(ctx.now)) {
			const idx = indexOfNearest(
				values.map((v) => new Date(v).getTime()),
				new Date(ctx.now).getTime()
			);
			console.log({ idx });
		}
	});
</script>

<TemporalSlider
	values={covCtx.coverage?.t || []}
	onIndexChange={(idx) => covCtx.updateTemporalIndex(idx)}
	{buttonProps}
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
