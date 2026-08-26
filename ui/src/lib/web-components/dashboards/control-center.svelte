<script lang="ts">
	// This component houses the Dashboard Temporal Slider
	import { getDashCtx } from './ctx.svelte.ts';
	import TemporalSlider from '../sliders/temporal-control.svelte';
	import ModeWatcher from '../mode-watcher.svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	const ctx = getDashCtx();

	interface Props {
		class?: ClassValue;
	}
	let values = $derived(
		ctx.tvalues
			.keys()
			.toArray()
			.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
	);
	$inspect(ctx.now);
	let { class: className }: Props = $props();
</script>

<TemporalSlider bind:values onIndexChange={(idx) => ctx.setNow(values[idx])} class={cn(className)}
	>{#snippet children()}
		<ModeWatcher />
	{/snippet}
</TemporalSlider>
