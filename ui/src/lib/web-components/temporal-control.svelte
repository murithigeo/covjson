<script lang="ts">
	import {
		type TemporalResolution,
		indexOfNearest,
		isUndefined,
		parseDateString
	} from '@murithigeo/covjson-core';
	import { Slider } from '../components/ui/slider/index.ts';
	import * as ButtonGroup from '../components/ui/button-group/index.ts';
	import { Button } from '../components/ui/button/index.ts';
	import { Label } from '../components/ui/label/index.ts';
	import { TimerResetIcon, RepeatIcon, RepeatOffIcon, PlayIcon, PauseIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { SvelteSet } from 'svelte/reactivity';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils.js';
	/**
	 * @todo slider:svelte/motion for play
	 */
	interface Props {
		values: SvelteSet<string>;
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
		children?: Snippet;
		class?: ClassValue;
		globalT?: string;
	}
	let {
		selected = $bindable(),
		values: set = $bindable(),
		duration = $bindable(2000),
		onIndexChange,
		loop = $bindable(false),
		value = $bindable(),
		children,
		class: className,
		globalT = $bindable()
	}: Props = $props();
	let values = $derived(
		set
			.keys()
			.toArray()
			.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
	);
	/**
	 * Disallow if values are not loopable
	 */
	let disabled = $derived(values.length < 2);
	let index = $state(0);
	const getIndex = () => index;
	const setIndex = (i: number) => {
		index = i;
		value = values[i];
	};
	$effect(() => syncGlobalT2LocalT(globalT));
	$inspect(globalT);
	const syncGlobalT2LocalT = (t?: string) => {
		// console.log()
		if (isUndefined(t)) return;
		const bestMatch = indexOfNearest(
			values.map((v) => new Date(v).getTime()),
			new Date(t).getTime()
		);
		console.log({ bestMatch });
		if (bestMatch === -1) return;
		index = bestMatch;
	};
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
		if (disabled) return;
		player = setInterval(increment, duration);
	};
	const stop = () => {
		pause();
		index = 0;
	};
	const increment = () => {
		index += 1;
		index = (index + values.length) % values.length;
		if (index === 0 && !loop) pause();
	};
	$effect(() => onIndexChange?.(index));
	const setLoop = () => (loop = !loop);
</script>

<div class={cn('flex w-full flex-col place-items-center space-y-3', className)}>
	<Slider max={values.length - 1} type="single" bind:value={getIndex, setIndex} />
	<Label>{values[index]}</Label>
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
			<Button onclick={setLoop} {disabled}
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
