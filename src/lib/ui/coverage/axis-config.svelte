<script lang="ts">
	import { Slider } from '#lib/components/ui/slider/index.ts';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';
	import * as Select from '#lib/components/ui/select/index.ts';
	import * as Accordion from '#lib/components/ui/accordion/index.ts';
	import * as Field from '#lib/components/ui/field/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import type { Axis, AxisConfig, AxisConfiguratorProps, ChartDimensions } from './types';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.ts';
	import * as Table from '#lib/components/ui/table/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { SquareDimensionsIcon } from '@lucide/svelte';
	import { isUndefined, minMax } from '#lib/core/index.ts';
	import { SvelteMap } from 'svelte/reactivity';
	import { Checkbox } from 'bits-ui';
	let {
		config = $bindable(),
		axes,
		axisResolver: resolver = (_, i) => i,
		axisNames = $bindable()
	}: AxisConfiguratorProps = $props();

	const getAxisValues = (name: Axis): number[] => {
		const value = axisNames?.get(name);
		if (Array.isArray(value)) return value;
		const max = axes.find(([an]) => an === name)?.[1] || 0;
		return [
			isUndefined(value?.start) ? 0 : value.start,
			isUndefined(value?.stop) ? max : value.stop
		];
	};
	const setAxisValues = (name: Axis, values: number[]): void => {
		axisNames?.set(name, { start: values[0], stop: values[1] });
	};
	let x_ = new SvelteMap<string, 'range' | 'select'>();
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>axis name</Table.Head>
			<Table.Head>Preload</Table.Head>
			<Table.Head>x</Table.Head>
			<Table.Head>fx</Table.Head>
			<Table.Head>fy</Table.Head>
			<Table.Head>y1</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each axes as [an, max], i (i)}
			<Table.Row>
				<Table.Cell rowspan={3}>{an}</Table.Cell>
				<Table.Cell
					><Switch
						bind:checked={
							() => {
								const dets = axisNames?.get(an);
								if (!dets) return false;
								if (Array.isArray(dets)) {
									return dets.every((v) => Array(max).keys().toArray().includes(v));
								}

								return dets.start === 0 && dets.stop === max;
							},
							(checked) => axisNames?.set(an, { stop: checked ? max : undefined })
						}
					/></Table.Cell
				>
				{#each Array<ChartDimensions>('x', 'fx', 'fy', 'y1') as dimension (dimension)}
					<Table.Cell>
						<Switch
							disabled={max < 2}
							bind:checked={
								() => config.get(dimension) === an,
								(checked) => (checked ? config.set(dimension, an) : config.delete(dimension))
							}
						/>
					</Table.Cell>
				{/each}
			</Table.Row>

			<Table.Row>
				<Table.Cell colspan={5}>
					<Slider
						{max}
						step={1}
						type="multiple"
						bind:value={
							() => {
								const val = axisNames?.get(an);
								if (!val) return [0, max];
								if (Array.isArray(val)) return minMax(val);
								return [val.start || 0, val.stop || max];
							},
							(values) => {
								axisNames?.set(an, { start: values[0], stop: values[1] });
							}
						}
					/>
				</Table.Cell>
			</Table.Row>
			<Table.Row>
				<Table.Cell class="w-full items-center">Givevvervrvvrv</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
