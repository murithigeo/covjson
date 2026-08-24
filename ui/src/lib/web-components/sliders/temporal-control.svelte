<script lang="ts">
	import Slider from './slider.svelte';
	import type { ComponentProps } from 'svelte';
	import { cn } from '$lib/utils.js';
	import {
		type TemporalResolution,
		indexOfNearest,
		isUndefined,
		parseDateString
	} from '@murithigeo/covjson-core';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { TimerResetIcon, RepeatIcon, RepeatOffIcon, PlayIcon, PauseIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'clsx';

	interface Props extends ComponentProps<typeof Slider<string>> {
		children?: Snippet;
		onIndexChange?: (index: number) => void;
		loop?: boolean;
		duration?: number;
		class?: ClassValue;
		now?: string;
	}
	let {
		values = $bindable(),
		index = $bindable(0),
		value = $bindable(),
		loop = $bindable(),
		duration = $bindable(2000),
		formatter,
		class: className,
		min = $bindable(),
		max = $bindable(),
		children,
		now = $bindable(),
		onIndexChange
	}: Props = $props();
	let minIndex = $state(0);
	let maxIndex = $derived(values.length - 1);
	$effect(() => onIndexChange?.(index));
	// $effect(() => {
	// 	if (values.length < 1) return;
	// 	// const bestMatch = indexOfNearest(
	// 	// 	values.map((v) => new Date(v).getTime),
	// 	// 	new Date(now).getTime()
	// 	// );
	// });
	/**
	 * Disable playback if single valued
	 */
	let disabled = $derived(values.length < 2);

	let player = $state<NodeJS.Timeout>();
	const pause = () => {
		clearInterval(player);
		player = undefined;
	};
	const setLoopState = () => (loop = !loop);

	const increment = () => {
		index += 1;
		// todo: now that we have the min and max, ensure looping occurs within bounds
		index = (index + values.length) % values.length;
		if (index === values.length - 1 && !loop) pause();
	};
	const play = () => {
		if (disabled) return;
		player = setInterval(increment, duration);
	};
	const setPlayState = () => {
		if (player) pause();
		else play();
	};
	const stop = () => {
		pause();
		index = 0;
	};

	// use d3-shape scaleUTC instead for easier ticks
</script>

<div class={cn('flex w-full flex-col place-items-center space-y-3', className)}>
	<Slider
		bind:values
		bind:index
		bind:maxIndex
		bind:minIndex
		bind:min
		bind:max
		bind:value
		{onIndexChange}
	/>
	<div class="flex flex-row items-center space-x-2">
		<ButtonGroup.Root>
			<Button onclick={setPlayState} {disabled}>
				{#if player}
					<PauseIcon />
				{:else}
					<PlayIcon />
				{/if}
			</Button>
			<Button onclick={stop} {disabled}><TimerResetIcon /></Button>
			<Button onclick={setLoopState} {disabled}
				>{#if loop}
					<RepeatOffIcon />
				{:else}
					<RepeatIcon />
				{/if}</Button
			>
		</ButtonGroup.Root>
		{@render children?.()}
	</div>
</div>
