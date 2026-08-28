<script lang="ts">
	// This component houses the Dashboard Temporal Slider
	import { getDashCtx } from './ctx.svelte.ts';
	import TemporalControl from '$lib/sliders/temporal-control.svelte';
	import ModeWatcher from '$lib/mode-watcher.svelte';

	import type { ClassValue } from 'clsx';
	const ctx = getDashCtx();

	interface Props {
		class?: ClassValue;
	}
	let buttonProps: ButtonProps = { size: 'icon-sm', variant: 'outline' };
	let { ...props }: Props = $props();
</script>

<TemporalControl
	values={ctx.tvalues
		.keys()
		.toArray()
		.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())}
	onIndexChange={({ value }) => ctx.setNow(value)}
	{buttonProps}
	{...props}
	>{#snippet children()}
		<ModeWatcher {buttonProps} />
	{/snippet}
</TemporalControl>
