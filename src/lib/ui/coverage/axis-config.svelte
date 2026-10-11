<script lang="ts">
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';
	import type { AxisConfiguratorProps, ChartDimensions } from './types';
	import * as Table from '#lib/components/ui/table/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { Slider } from '#lib/components/ui/slider/index.ts';
	import { EllipsisIcon } from '@lucide/svelte';
	let {
		config = $bindable(),
		axes,
		axisResolver: resolver = (_, i) => i,
		axisNames = $bindable()
	}: AxisConfiguratorProps = $props();
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
							disabled={max < 2}
							bind:checked={
								() => config.get(dimension) === an,
								(checked) => (checked ? config.set(dimension, an) : config.delete(dimension))
							}
						/>
					</Table.Cell>
				{/each}
				<Table.Cell class="border text-center">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger><EllipsisIcon /></DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Label>Range</DropdownMenu.Label>
								<DropdownMenu.Item closeOnSelect={false}>
									<Slider
										type="multiple"
										max={max - 1}
										step={1}
										value={[0, max]}
										onValueChange={(v) => axisNames?.set(an, Array(max).slice(v[0], v[1]))}
									/>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.CheckboxGroup onValueChange={(v) => axisNames?.set(an, v.map(Number))}>
								<DropdownMenu.Label>Custom</DropdownMenu.Label>
								{#each [...Array(max).keys()] as idx (idx)}
									<DropdownMenu.CheckboxItem value={idx.toString()} checked
										>idx:{idx}</DropdownMenu.CheckboxItem
									>
								{/each}
							</DropdownMenu.CheckboxGroup>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
