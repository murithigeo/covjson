<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Slider } from '#lib/components/ui/slider/index.ts';
	import { CustomDate } from '#lib/core/index.ts';
	import type { AxisNamesOptions } from '#lib/core/types.js';
	import { cn } from '#lib/utils.ts';
	import type { ClassValue } from 'clsx';

	interface Props {
		max: number;
		values?: AxisNamesOptions;
		class?: ClassValue;
		resolver?: (i: number) => string | CustomDate | number;
	}

	let { max, values = $bindable(), resolver = (i) => i, class: className }: Props = $props();

	// Currently swaps values if hovered. Maybe confirm button
	let value = $state([0, max - 1]);

	let minMax = $derived(
		value.map((v) => {
			const val = resolver(v);
			if (val instanceof CustomDate) return val.value;
			return val;
		})
	);
</script>

<div class={cn('w-full items-center', className)}>
	<Slider type="multiple" min={0} max={max - 1} step={1} bind:value />

	<span class="flex flex-wrap">{minMax[0]} - {minMax[1]}</span>
	<Button variant="outline" size="sm" onclick={() => (values = { start: value[0], stop: value[1] })}
		>Confirm</Button
	>
</div>
