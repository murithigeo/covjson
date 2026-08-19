<script lang="ts">
	import { type TemporalResolution, parseDateString } from '@murithigeo/covjson-core';
	import { Slider } from '../components/ui/slider/index.ts';
	import * as ButtonGroup from '../components/ui/button-group/index.ts';
	import { Button } from '../components/ui/button/index.ts';
	import { Label } from '../components/ui/label/index.ts';
	import { TimerResetIcon, RepeatIcon, RepeatOffIcon, PlayIcon, PauseIcon } from '@lucide/svelte';
	/**
	 * @todo slider:svelte/motion for play
	 */
	interface Props {
		values: string[];
		value?: string;
		onIndexChange?: (index: number) => void;
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
		onIndexChange,
		loop = $bindable(false),
		value = $bindable(values[0])
	}: Props = $props();
	/**
	 * Disallow if values are not loopable
	 */
	let disabled = $derived(values.length < 2);
	let index = $state(0);
	let player = $state<NodeJS.Timeout>();
	$effect(() => {
		value = values[index];
	});
	const setPlayState = () => {
		if (player) pause();
		else play();
	};

	const pause = () => {
		clearInterval(player);
		player = undefined;
	};
	const play = () => {
		if (disabled) return;
		player = setInterval(increment, duration);
	};
	const stop = () => {
		pause();
		index = 0;
	};
	$effect(() => {});
	const increment = () => {
		index += 1;
		index = (index + values.length) % values.length;
		if (index === 0 && !loop) pause();
	};
	$effect(() => onIndexChange?.(index));
	const setLoop = () => (loop = !loop);
</script>

<div class="flex w-full flex-col place-items-center space-y-3">
	<Slider max={values.length - 1} type="single" bind:value={index} />
	<Label>{values[index]}</Label>
	<ButtonGroup.Root>
		<Button onclick={setPlayState} {disabled}>
			{#if player}
				<PauseIcon />
			{:else}
				<PlayIcon />
			{/if}
		</Button>
		<Button onclick={stop} {disabled}><TimerResetIcon /></Button>
		<Button onclick={setLoop} {disabled}
			>{#if loop}
				<RepeatOffIcon />
			{:else}
				<RepeatIcon />
			{/if}</Button
		>
	</ButtonGroup.Root>
</div>
