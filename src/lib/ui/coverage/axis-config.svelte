<script lang="ts">
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.ts';
	import type { Axis, ChartDimensions } from './types';
	import * as Table from '#lib/components/ui/table/index.ts';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { EllipsisIcon } from '@lucide/svelte';
	import { axisOptionsToList, isUndefined } from '#lib/core/index.ts';
	import type { AxisNamesOptions } from '#lib/core/types.d.ts';
	import Slider from './slider.svelte';
	import { getCovContext } from './ctx.svelte.ts';

	let ctx = $derived(getCovContext());
	const getValues = (an: Axis, max: number) => {
		const values = axisOptionsToList(ctx.axesSize.get(an), ctx.axisNames.get(an));
		return {
			boolean: values.length === max,
			number: values,
			string: values.map((v) => v.toString())
		};
	};
	const setValues = (an: Axis, v: AxisNamesOptions | string[]) => {
		if (Array.isArray(v)) v = v.map((d) => Number(d));

		const existing = ctx.axisNames.get(an);
		if (isUndefined(existing) || Array.isArray(existing) || typeof existing === 'boolean')
			return ctx.axisNames?.set(an, v); // Complete replacement
		if (Array.isArray(v) || typeof v === 'boolean') return ctx.axisNames.set(an, v);
		ctx.axisNames.set(an, { ...existing, ...v });
	};
</script>

<Table.Root class="w-full table-fixed">
	<Table.Caption>Configure what data is loaded and how it is visualized</Table.Caption>
	<Table.Header>
		<Table.Row
			><Table.Head rowspan={2} class="border text-left align-bottom md:text-center"
				>axisName</Table.Head
			>
			<Table.Head colspan={4} class="border text-center">Chart Accessor</Table.Head>
			<Table.Head rowspan={2} class="border text-center align-bottom">Options</Table.Head
			></Table.Row
		>
		<Table.Row>
			<Table.Head class="border">x</Table.Head>
			<Table.Head class="border">fx</Table.Head>
			<Table.Head class="border">fy</Table.Head>
			<Table.Head class="border">series</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each ctx.axesSize as [an, max], i (i)}
			<Table.Row>
				<Table.Cell class="border whitespace-nowrap">{an}</Table.Cell>

				{#each Array<ChartDimensions>('x', 'fx', 'fy', 'series') as dimension (dimension)}
					<Table.Cell class="border whitespace-nowrap">
						<Switch
							disabled={!max}
							aria-disabled={!max}
							bind:checked={
								() => ctx.config.get(dimension) === an,
								(checked) => {
									if (!checked) {
										ctx.config.delete(dimension);
										ctx.axisNames.set(an, false);
										return;
									}
									for (const [dim, axisName] of ctx.config) {
										if (axisName === an && dim !== dimension) ctx.config.delete(dim);
									}
									ctx.config.set(dimension, an);
									ctx.axisNames.set(an, true);
								}
							}
						/>
					</Table.Cell>
				{/each}
				<Table.Cell class="border text-center">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger disabled={!max}><EllipsisIcon /></DropdownMenu.Trigger>

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
											resolver={(index) => ctx.resolve(an, index)}
										/>
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
												>{ctx.resolve(an, idx)}
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
			<Table.Cell class="border text-center break-all whitespace-normal">Horizontal Axis</Table.Cell
			>
			<Table.Cell colspan={2} class="border text-center break-all whitespace-normal">
				Partition the data into a grid of panels, one per distinct value
			</Table.Cell>
			<Table.Cell class="border text-center break-all whitespace-normal">Group by</Table.Cell>
			<Table.Cell class="border text-center break-all whitespace-normal">Constrain</Table.Cell>
		</Table.Row>
	</Table.Footer>
</Table.Root>
