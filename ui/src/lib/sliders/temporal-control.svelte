<script lang="ts">
	import Slider from './slider.svelte';
	import type { ComponentProps } from 'svelte';
	import { cn } from '$lib/utils.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import { TimerResetIcon, RepeatIcon, RepeatOffIcon, PlayIcon, PauseIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props extends ComponentProps<typeof Slider<string>> {
		children?: Snippet;
		loop?: boolean;
		duration?: number;
		buttonProps?: ButtonProps;
	}
	let {
		values = $bindable(),
		index = $bindable([0, 0, Math.abs(values.length)]),
		value = $bindable(),
		loop = $bindable(),
		duration = $bindable(2000),
		children,
		buttonProps = {},
		class: className,
		...props
	}: Props = $props();
	let disabled = $derived(values.length < 2);
	let player = $state<NodeJS.Timeout>();
	const pause = () => {
		clearInterval(player);
		player = undefined;
	};
	const setLoopState = () => (loop = !loop);

	const increment = () => {
		let [, i] = index;
		i += 1;
		// todo: now that we have the min and max, ensure looping occurs within bounds
		i = (i + values.length) % values.length;
		index = [index[0], i, index[2]];
		if (i === values.length - 1 && !loop) pause();
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
		index = [index[0], index[0], index[2]]; // Set to current minimum
	};

	// use d3-shape scaleUTC instead for easier ticks
</script>

<div class={cn('flex w-full flex-col place-items-center space-y-3', className)}>
	<Slider bind:values bind:value bind:index {...props} {disabled} />
	<div class="flex flex-row items-center space-x-2">
		<ButtonGroup.Root>
			<Button onclick={setPlayState} {disabled} {...buttonProps}>
				{#if player}
					<PauseIcon />
				{:else}
					<PlayIcon />
				{/if}
			</Button>
			<Button onclick={stop} {disabled} {...buttonProps}><TimerResetIcon /></Button>
			<Button onclick={setLoopState} {disabled} {...buttonProps}
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
