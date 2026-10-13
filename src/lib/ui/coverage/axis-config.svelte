<script lang="ts">
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';
	import type { AxisConfiguratorProps, ChartDimensions } from './types';
	import * as Table from '#lib/components/ui/table/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { EllipsisIcon } from '@lucide/svelte';
	import { isUndefined } from '#lib/core/index.ts';
	import type { AxisNamesOptions } from '#lib/core/types.js';
	import Slider from './slider.svelte';
	let {
		config = $bindable(),
		axes,
		axisResolver: resolver = (_, i) => i.toString(),
		axisNames = $bindable()
	}: AxisConfiguratorProps = $props();

	const getValues = (axisName: string, max: number) => {
		let values = axisNames?.get(axisName) || [];
		if (typeof values === 'boolean') {
			values = values ? { start: 0, stop: max } : [];
		}

		if (!Array.isArray(values)) {
			if (!isUndefined(values.stop)) values.stop = values.stop + 1;
			values = [...Array(max).keys()].slice(values.start, values.stop);
		}
		return {
			boolean: values.length === max,
			number: values,
			string: values.map((v) => v.toString())
			// get obj(){
			// 	if(numListIsRegular(values))return ["min","max"]
			// }
		};
	};
	const setValues = (an: string, v: AxisNamesOptions | string[]) => {
		if (Array.isArray(v)) v = v.map((d) => Number(d));

		const existing = axisNames?.get(an);
		if (isUndefined(existing) || Array.isArray(existing) || typeof existing === 'boolean')
			return axisNames?.set(an, v); // Complete replacement
		if (Array.isArray(v) || typeof v === 'boolean') return axisNames?.set(an, v);
		axisNames?.set(an, { ...existing, ...v });
	};

	// todo more than one property access for the row
</script>

<Table.Root class="table-auto border">
	<Table.Header>
		<Table.Row
			><Table.Head rowspan={2} class="border text-center">axisName</Table.Head>
			<Table.Head colspan={4} class="border text-center">Chart Accessor</Table.Head>
			<Table.Head rowspan={2} class="border text-center">Options</Table.Head></Table.Row
		>
		<Table.Row>
			<Table.Head class="border">x</Table.Head>
			<Table.Head class="border">fx</Table.Head>
			<Table.Head class="border">fy</Table.Head>
			<Table.Head class="border">y1</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each axes as [an, max], i (i)}
			<Table.Row>
				<Table.Cell class="border">{an}</Table.Cell>

				{#each Array<ChartDimensions>('x', 'fx', 'fy', 'y1') as dimension (dimension)}
					<Table.Cell class="border">
						<Switch
							// Works but enable for currently selected value
							disabled={max < 2 ||
								config.entries().some(([dim, axis]) => dim !== dimension && axis !== an)}
							bind:checked={
								() => config.get(dimension) === an,
								(checked) => (checked ? config.set(dimension, an) : config.delete(dimension))
							}
						/>
					</Table.Cell>
				{/each}
				<Table.Cell class="border text-center">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger disabled={max < 2}><EllipsisIcon /></DropdownMenu.Trigger>

						<DropdownMenu.Content>
							<DropdownMenu.Item class="flex space-x-1">
								Load All
								<Switch bind:checked={() => getValues(an, max).boolean, (v) => setValues(an, v)} />
							</DropdownMenu.Item>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger>Range</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent>
									<DropdownMenu.Item closeOnSelect={false}>
										<Slider
											{max}
											bind:values={() => getValues(an, max).number, (v) => setValues(an, v)}
											class="flex flex-col space-y-2"
											resolver={(index) => resolver?.(an, index)}
										></Slider>
									</DropdownMenu.Item>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger>Select</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent>
									<DropdownMenu.CheckboxGroup
										bind:value={() => getValues(an, max).string, (v) => setValues(an, v)}
									>
										{#each { length: max }, idx (idx)}
											<DropdownMenu.CheckboxItem value={idx.toString()}
												>{resolver(an, idx)}
											</DropdownMenu.CheckboxItem>
										{/each}
									</DropdownMenu.CheckboxGroup>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
	<Table.Footer>
		<Table.Row>
			<Table.Cell></Table.Cell>
			<Table.Cell class="border text-center">Horizontal Axis</Table.Cell>
			<Table.Cell colspan={2} class="border text-center whitespace-normal">
				<a href="https://www.layerchart.com/docs/guides/facets" rel="external"
					>Faceting partitions the data into a grid of panels, one per distinct value</a
				>
			</Table.Cell>
			<Table.Cell class="border text-center whitespace-normal"
				>Render multiple splines if axes supports it</Table.Cell
			>
			<Table.Cell class="border text-center whitespace-normal"
				>Specify which axis values get loaded/visualized</Table.Cell
			>
		</Table.Row>
	</Table.Footer>
</Table.Root>
