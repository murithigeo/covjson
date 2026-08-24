<script lang="ts">
	import ModeWatcher from './mode-watcher.svelte';
	import TemporalControl from './sliders/temporal-control.svelte';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	interface Props {
		tvalues: Array<string>;
		now?: string;
		class?: ClassValue;
	}

	// todo add badge to filter by domainType,parameter(dataType,range etc) etc
	let { now = $bindable(), tvalues = $bindable(), class: className }: Props = $props();
</script>

<TemporalControl bind:values={tvalues} bind:value={now} class={cn(className)}>
	{#snippet children()}
		<ModeWatcher />
	{/snippet}
</TemporalControl>
