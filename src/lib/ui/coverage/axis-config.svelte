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
	import { isUndefined } from '#lib/core/index.ts';
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
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>axis name</Table.Head>
			<Table.Head>x</Table.Head>
			<Table.Head>fx</Table.Head>
			<Table.Head>fy</Table.Head>
			<Table.Head>y1</Table.Head>
			<Table.Head>constraints</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each axes as [an, max]}
			<Table.Row>
				<Table.Cell>{an}</Table.Cell>
				{#each Array<ChartDimensions>('x', 'fx', 'fy', 'y1') as dimension (dimension)}
					<Table.Cell>
						<Switch
							bind:checked={
								() => config.get(dimension) === an,
								(checked) => (checked ? config.set(dimension, an) : config.delete(dimension))
							}
						/>
					</Table.Cell>
				{/each}
				<Table.Cell>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>Customize</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Item onSelect={() => axisNames?.set(an, { start: 0, stop: max })}>
								Load All
							</DropdownMenu.Item>

							<DropdownMenu.Item>
								<Slider
									min={0}
									{max}
									step={1}
									type="multiple"
									bind:value={() => getAxisValues(an), (values) => setAxisValues(an, values)}
								/>
							</DropdownMenu.Item>
							<DropdownMenu.CheckboxGroup onValueChange={(values) => {}}>
								<DropdownMenu.Label>CustomItems</DropdownMenu.Label>
							</DropdownMenu.CheckboxGroup>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
