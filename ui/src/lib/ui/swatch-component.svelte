<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { ClassValue } from 'clsx';
	import type { Snippet } from 'svelte';

	interface Props {
		fallbackText: string;
		class?: ClassValue;
		children?: Snippet;
	}
	let { fallbackText, class: className, children }: Props = $props();
</script>

<div
	class={cn(
		[
			'size-8 border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400',
			'flex shrink-0 items-center justify-center rounded-none font-mono font-semibold'
		],
		className
	)}
>
	{#if children}
		{@render children()}
	{:else}
		{fallbackText.substring(0, 1)}
	{/if}
</div>
