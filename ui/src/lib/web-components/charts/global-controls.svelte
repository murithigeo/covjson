<script lang="ts">
	import ModeWatcher from '../mode-watcher.svelte';
	import TemporalControl from '../temporal-control.svelte';
	import type { SvelteSet } from 'svelte/reactivity';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	interface Props {
		tvalues: SvelteSet<string>;
		t?: string;
		class?: ClassValue;
	}

	let { t = $bindable(), tvalues = $bindable(), class: className }: Props = $props();
	$inspect({ t });
</script>

<TemporalControl bind:values={tvalues} bind:value={t} class={cn('place-items-center', className)}>
	{#snippet children()}
		<ModeWatcher />
	{/snippet}
</TemporalControl>
