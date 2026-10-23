<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.ts';
	import type { DataRow } from '#lib/core/coverage.ts';
	import { isNull, isUndefined } from '#lib/core/index.ts';
	import { getCovContext } from './ctx.svelte.ts';
	import type { Axis } from './types';

	let { data, key, categoric }: { data: DataRow[]; categoric?: boolean; key: string } = $props();
	const ctx = getCovContext();
	const axes = $derived(ctx.axesSize);
	let _axes = $derived(
		axes
			.entries()
			.filter(([, size]) => size > 0)
			.toArray()
	);
</script>

<Table.Root class="table-auto">
	<Table.Caption>Tabulated {key} data.</Table.Caption>

	<Table.Header>
		<Table.Row>
			{#each _axes as [axisName] (axisName)}
				<Table.Head class="border">{axisName}</Table.Head>
			{/each}
			<Table.Head class="border">value</Table.Head>
			{#if categoric}
				<Table.Head class="border">category</Table.Head>
			{/if}
		</Table.Row>
	</Table.Header>

	<Table.Body>
		<!-- 
          Recursive snippet that drills down through axesSize 
          depth: Current axis index
          currentRows: The filtered subset of data up to this point
          inheritedCells: Parent grouping cells waiting to be rendered on the first row
        -->

		{@render renderAxis({
			depth: 0,
			currentRows: data,
			inheritedCells: []
		})}
	</Table.Body>
	<Table.Footer>
		{#if data.length}
			<Table.Row>
				{#each _axes as [axisName] (axisName)}
					<Table.Head class="border">{axisName}</Table.Head>
				{/each}
				<Table.Head class="border">value</Table.Head>
				{#if categoric}
					<Table.Head class="border">category</Table.Head>
				{/if}
			</Table.Row>
		{/if}
	</Table.Footer>
</Table.Root>

<!-- Add copy button where user can copy as GeoJSON geometry -->
{#snippet renderAxis({
	depth,
	currentRows,
	inheritedCells
}: {
	depth: number;
	currentRows: DataRow[];
	inheritedCells: {
		/**
		 * Current axis index
		 */
		index: number;
		/**
		 * The rowspan of the axis name index
		 */
		rowspan: number;
		axisName: Axis;
	}[];
})}
	{@const [axisName, max] = _axes[depth]}
	{@const isLastAxis = depth === _axes.length - 1}

	<!-- Only iterate over indices ('ani') that actually exist in the remaining data -->
	{@const validIndices = [...Array(max).keys()].filter((ani) =>
		currentRows.some((r) => r[axisName] === ani)
	)}

	{#each validIndices as ani, index (ani)}
		<!-- Filter data for this specific axis value -->
		{@const matchedRows = currentRows.filter((r) => r[axisName] === ani)}

		<!-- Create the cell for the current level -->
		{@const currentCell:(typeof inheritedCells)[0] = { axisName, index: ani, rowspan: matchedRows.length }}

		<!-- CRITICAL: Only pass the inherited rowspans down to the VERY FIRST child group (index === 0).
		 	Subsequent groups in this loop just render their own cell. -->
		{@const cellsToRender = index === 0 ? [...inheritedCells, currentCell] : [currentCell]}

		{#if isLastAxis}
			<!-- We hit the innermost axis. Now we actually render the Table.Rows -->
			{#each matchedRows as row, rowIndex (rowIndex)}
				<Table.Row>
					<!-- Render the accumulated rowspans ONLY on the first row of this deepest group -->
					{#if rowIndex === 0}
						{#each cellsToRender as cell, index (index)}
							<Table.Cell
								rowspan={cell.rowspan}
								class="border align-middle break-all whitespace-normal"
							>
								{ctx.resolve?.(cell.axisName, cell.index)}
							</Table.Cell>
						{/each}
					{/if}

					{@const { [key]: value, [key + ':cat']: category } = row}
					<!-- Render the leaf row values -->
					<Table.Cell class="border break-all whitespace-normal"
						>{isNull(value) ? 'null' : isUndefined(value) ? 'null' : value}</Table.Cell
					>
					{#if categoric}
						<Table.Cell class="border break-all whitespace-normal">{category}</Table.Cell>
					{/if}
				</Table.Row>
			{/each}
		{:else}
			<!-- Not the last axis yet. Recurse deeper! -->
			{@render renderAxis({
				depth: depth + 1,
				currentRows: matchedRows,
				inheritedCells: cellsToRender
			})}
		{/if}
	{/each}
{/snippet}
