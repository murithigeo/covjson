<script lang="ts">
	import { Parameter as ParameterClass } from '$lib/core/parameters.js';
	import type { ClassValue } from 'clsx';
	import type { Parameter } from 'coveragejson';
	import ParameterComponent from './parameter.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { cn } from '$lib/utils.js';

	// todo create a dedicated component for Parameter Groups
	// On click on member go to parameter #parameter-[name]
	interface Props {
		data: Record<string, ParameterClass | Parameter>;
		class?: ClassValue;
		selected?: SvelteSet<string>;
	}

	let { data, class: className, selected = $bindable() }: Props = $props();

	let parameters = $derived(
		Object.entries(data).map(([k, v]) => {
			if (v instanceof ParameterClass) return v;
			return new ParameterClass(v, k, 'en');
		})
	);
</script>

<div class={cn('flex flex-row flex-wrap gap-3 pt-2', className)}>
	{#each parameters as data (data.key)}
		<ParameterComponent {data} bind:selected />
	{/each}
</div>
