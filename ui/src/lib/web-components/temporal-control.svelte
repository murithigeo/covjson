<script lang="ts">
	import { type TemporalResolution, parseDateString } from '@murithigeo/covjson-core';
	import { Slider } from '../components/ui/slider/index.ts';
	import * as ButtonGroup from '../components/ui/button-group/index.ts';
	import { Button } from '../components/ui/button/index.ts';
	import { Label } from '../components/ui/label/index.ts';
	import { TimerReset, Play, Pause, Repeat, RepeatOff } from '@lucide/svelte';
	/**
	 * @todo slider:svelte/motion for play
	 */
	interface Props {
		/**
		 * Assumes that the values are sorted
		 */
		values: string[];
		/**
		 * The current temporal value
		 */
		onValueChange?: (val: string) => void;
		/**
		 * How to format the current value
		 */
		formatter?(v: string, resolution: TemporalResolution): string;
		/**
		 * The values currently in the range
		 */
		selected?: string[];
		/**
		 * Player duration
		 */
		duration?: number;
		/**
		 *
		 */
		loop?: boolean;
	}
	let {
		selected = $bindable(),
		values = $bindable(),
		duration = $bindable(2000),
		onValueChange,
		loop = $bindable(false)
	}: Props = $props();

	let index = $state(0);
	let player = $state<NodeJS.Timeout>();

	const setPlayState = () => {
		if (player) pause();
		else play();
	};

	const pause = () => {
		clearInterval(player);
		player = undefined;
	};
	const play = () => {
		player = setInterval(increment, duration);
	};
	const stop = () => {
		pause();
		index = 0;
	};
	$effect(() => onValueChange?.(values[index]));
	const increment = () => {
		index += 1;
		index = (index + values.length) % values.length;
		if (index === 0 && !loop) pause();
	};
	const setLoop = () => (loop = !loop);
</script>

<div class="flex w-full flex-col place-items-center space-y-3">
	<Slider max={values.length - 1} type="single" bind:value={index} />
	<Label>{values[index]}</Label>
	<ButtonGroup.Root>
		<Button onclick={setPlayState}>
			{#if player}
				<Pause />
			{:else}
				<Play />
			{/if}
		</Button>
		<Button onclick={stop}><TimerReset /></Button>
		<Button onclick={setLoop}
			>{#if loop}
				<RepeatOff />
			{:else}
				<Repeat />
			{/if}</Button
		>
	</ButtonGroup.Root>
</div>
