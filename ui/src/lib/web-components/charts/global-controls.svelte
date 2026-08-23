<script lang="ts">
	import ModeWatcher from '../mode-watcher.svelte';
	import TemporalControl from '../sliders/temporal-control.svelte';
	import type { SvelteSet } from 'svelte/reactivity';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	interface Props {
		tvalues: SvelteSet<string>;
		t?: string;
		class?: ClassValue;
	}

	// todo add badge to filter by domainType,parameter(dataType,range etc) etc
	let { t = $bindable(), tvalues = $bindable(), class: className }: Props = $props();
</script>

<TemporalControl bind:values={tvalues} bind:value={t} class={cn(className)}>
	{#snippet children()}
		<ModeWatcher />
	{/snippet}
</TemporalControl>
