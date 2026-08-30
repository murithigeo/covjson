<script lang="ts">
	// This component houses the Dashboard Temporal Slider
	import { getDashCtx } from './ctx.svelte.ts';
	import TemporalControl from '$lib/sliders/temporal-control.svelte';
	import ModeWatcher from '$lib/mode-watcher.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	import type { ButtonProps } from '$lib/components/ui/button/index.js';
	const ctx = getDashCtx();

	interface Props {
		class?: ClassValue;
	}
	let buttonProps: ButtonProps = { size: 'icon-sm', variant: 'outline' };
	let { class: className }: Props = $props();
</script>

<TemporalControl
	values={ctx.tvalues
		.keys()
		.toArray()
		.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())}
	onIndexChange={({ value }) => ctx.setNow(value)}
	{buttonProps}
	class={cn('w-full', className)}
	>{#snippet children()}
		<ModeWatcher {buttonProps} />
	{/snippet}
</TemporalControl>
