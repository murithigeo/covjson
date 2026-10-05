<script lang="ts" module>
	import {
		type DataRow,
		type Coverage,
		CustomDate,
		isNull,
		isUndefined,
		type InferDomainClass
	} from '@murithigeo/covjson-core';
	import type { ReactiveParameter } from '#lib/dashboards/utils/parameter.svelte.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import type { AxisConfig, Axis } from './dimensions.ts';
	import {
		LineChart,
		LinearGradient,
		Points,
		Spline,
		defaultChartPadding,
		type ChartImageOptions,
		downloadImage
	} from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropDownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { scaleOrdinal } from 'd3-scale';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { DownloadIcon, ChevronDownIcon } from '@lucide/svelte';
	import type { MultiPoint, Polygon, Position, Section } from 'coveragejson';
	import type { SvelteMap } from 'svelte/reactivity';
</script>

<script lang="ts">
	interface Props extends AxisConfig {
		data: DataRow[];
		coverage: Coverage;
		parameter: ReactiveParameter;
		facetAll?: boolean;
		domain: ReturnType<InferDomainClass['denormalize']>;
		tabValue: 'chart' | 'table';
	}

	let {
		data: rows = $bindable([]),
		coverage = $bindable(),
		parameter = $bindable(),
		fx = $bindable(),
		x = $bindable(),
		fy = $bindable(),
		y1 = $bindable(),
		facetAll = $bindable(),
		domain = $bindable(),
		tabValue = $bindable(parameter.isString ? 'table' : 'chart')
	}: Props = $props();

	let axesSize = $derived(coverage.axesSize as Map<Axis, number>);
	let chartRef = $state<HTMLElement>();
	let stringy = parameter.isString;
	let categoric = $derived(parameter.isCategorical);

	let data = $derived(
		rows
			.map((d) => Object.entries(d))
			.map((e) => e.filter(([k]) => [...axesSize.keys(), parameter.key].includes(k)))
			.map((e): DataRow => Object.fromEntries(e))
			.map(({ [parameter.key]: value, ...r }): DataRow => {
				r.value = value;
				if (categoric) r.category = parameter.getCategory(value as number)?.id || '';
				return r;
			})
	);
	function resolveAxisIdx(
		axis: Axis,
		idx: number
	): string | number | (Polygon | MultiPoint | Section)['axes']['composite']['values'][number] {
		if (axis === 'z' || axis === 't') return coverage[axis][idx];
		// @ts-expect-error domain is denormalized
		return domain.axes[axis]?.values[idx];
	}
	function resolveAxisIdxForChart(axis: Axis, idx: number): number | CustomDate {
		let value = resolveAxisIdx(axis, idx);
		if (Array.isArray(value)) {
			if (typeof value[0] === 'string') value = value[0];
			else value = idx;
			/// Others resolve to an object with {axis,idx} so that we resolve in tooltip
		}
		if (typeof value === 'string') return new CustomDate(value);
		return value;
	}

	/**
	 * https://stackoverflow.com/a/31536517
	 */
	const rowsToCsv = () => {
		const axisNames = [...axesSize.keys()];
		const header = [...axisNames, 'value'];
		if (categoric) header.push('category');
		return [
			header.join(','),
			...data.map((row) =>
				header.map((fieldName) => {
					let value: unknown = row[fieldName];
					//@ts-expect-error fieldName should Axis
					if (axisNames.includes(fieldName)) value = resolveAxisIdx(fieldName, value);
					return JSON.stringify(value, (k, v) => {
						if (isUndefined(v)) return 'undefined';
						if (!isNull(v)) return 'null';
						if (Array.isArray(v)) return `${v}`;
						return v;
					});
				})
			)
		].join('\r\n');
	};
	let filename = $derived(`coverage-${coverage.id || coverage.uuid}_${parameter.key}`);
	/**
	 * Only enable when downloading & disable again
	 */
	let legend = $state(false);
	function download(format: 'csv' | ChartImageOptions['format']): void {
		if (format !== 'csv') {
			// legend = true;
			if (!chartRef) return;
			downloadImage(chartRef, { filename, format }); //.then(()=>legend = false)
			return;
		}
		const str = rowsToCsv();
		const blob = new Blob([str], { type: 'text/csv;charset=utf-8' });
		const container = document.createElement('a');
		container.href = URL.createObjectURL(blob);
		container.download = filename + '.csv';
		container.click();
		container.remove();

		setTimeout(() => URL.revokeObjectURL(container.href), 0);
	}
	let chartConfig = $derived<Record<string, Record<'key' | 'label', string> & { color?: string }>>({
		[parameter.key]: {
			key: 'value',
			label: parameter.simpleLabel,
			color: categoric ? undefined : parameter.color
		}
	});
</script>

<Card.Root>
	<Card.Content>
		<Tabs.Root bind:value={tabValue}>
			<Tabs.Content value="table" class="w-full overflow-auto">
				{@render table()}
			</Tabs.Content>
			{#if !stringy}
				<Tabs.Content value="chart">
					<Chart.Container config={chartConfig}>
						<LineChart
							ref={chartRef}
							{data}
							series={Object.values(chartConfig)}
							x1={(d) => {
								if (isUndefined(y1)) return undefined;

								return resolveAxisIdxForChart(y1, d[y1]);
							}}
							x={(d) => {
								return resolveAxisIdxForChart(x, d[x]);
							}}
							fx={(d) => {
								if (isUndefined(fx)) return undefined;
								return resolveAxisIdxForChart(fx, d[fx]);
							}}
							fy={(d) => {
								if (isUndefined(fy)) return undefined;
								return resolveAxisIdxForChart(fy, d[fy]);
							}}
							// legend
							// bind:context
							facet={{
								axis: { facetAll: true }
							}}
							highlight={{ lines: true, points: true, facetAll }}
							padding={defaultChartPadding({ legend, right: 10 })}
							transform={{ mode: 'domain', axis: 'both' }}
							c={categoric ? 'category' : undefined}
							cScale={categoric ? scaleOrdinal() : undefined}
							cDomain={categoric
								? [...parameter.categories.entries().map(([id]) => id), '']
								: undefined}
							cRange={categoric
								? [
										...parameter.categories.values().map(({ color = parameter.color }) => color),
										parameter.color
									]
								: undefined}
							brush
							props={{ tooltip: { root: { facetAll: true } } }}
							onTooltipClick={(e, { data }) => console.log({ e, data })}
						>
							{#snippet tooltip()}
								<Chart.Tooltip
									labelFormatter={(d) => (d instanceof CustomDate ? d.value : d)}
									{facetAll}
								/>
							{/snippet}

							{#snippet marks({
								context: {
									height,
									padding: { top, bottom },
									yScale,
									series
								}
							})}
								{#if categoric}
									{@const getOffset = (v: number) => yScale(v) / (height + top + bottom)}
									<LinearGradient
										vertical
										units="userSpaceOnUse"
										stops={parameter.categories
											.values()
											.flatMap(({ color = parameter.color, values }) =>
												values.map((int): [number, string] => [int, color])
											)
											.toArray()
											.sort(([a], [b]) => b - a)
											.map(([int, color]): [number, string] => [getOffset(int), color])}
										>{#snippet children({ gradient })}
											{#each series.visibleSeries as serie (serie.key)}
												<Spline
													{...serie}
													stroke={gradient}
													class={(d) =>
														isNull(d) ? 'stroke-2 [stroke-dasharray:4_4]' : 'stroke-2'}
												/>
												<Points fill={gradient} r={4} />
											{/each}
										{/snippet}
									</LinearGradient>
								{:else}
									{#each series.visibleSeries as serie (serie.key)}
										<Spline {...serie} stroke={parameter.color} />
										<Points fill={parameter.color} r={4} />
									{/each}
								{/if}
							{/snippet}
						</LineChart>
					</Chart.Container>
				</Tabs.Content>
			{/if}
		</Tabs.Root>
	</Card.Content>
	<Card.Footer class="flex w-full flex-row flex-wrap justify-center gap-2">
		<Label
			><Badge variant="outline">min</Badge>{parameter.ranges
				.get(coverage.uuid)
				?.min?.toFixed(2)}</Label
		>
		<Label
			><Badge variant="outline">max</Badge>{parameter.ranges
				.get(coverage.uuid)
				?.max?.toFixed(2)}</Label
		>
		<Label
			><Badge variant="outline">mean</Badge>{parameter.ranges
				.get(coverage.uuid)
				?.mean?.toFixed(2)}</Label
		>
		<Label
			><Badge variant="outline">median</Badge>{parameter.ranges
				.get(coverage.uuid)
				?.median?.toString()}</Label
		>

		<ButtonGroup.Root>
			<!-- Render the preffered format when tabValue -->
			<Button
				variant="outline"
				class="flex gap-2"
				onclick={() => {
					tabValue === 'chart' ? download('csv') : download('png');
				}}><DownloadIcon /> {tabValue === 'chart' ? 'csv' : 'png'}</Button
			>
			<DropDownMenu.Root>
				<DropDownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" size="icon"><ChevronDownIcon /></Button>
					{/snippet}
				</DropDownMenu.Trigger>
				<DropDownMenu.Content align="center" class="w-auto">
					<DropDownMenu.Group>
						{@const disabled = stringy}
						<!-- These should set viewMode to chart and back again -->
						<!-- Or just render chart anyways but with a collapsible for table -->
						<DropDownMenu.Item {disabled} textValue="png" onSelect={() => download('png')}
							>PNG</DropDownMenu.Item
						>
						<DropDownMenu.Item {disabled} textValue="jpeg" onSelect={() => download('jpeg')}
							>JPEG</DropDownMenu.Item
						>
						<DropDownMenu.Item {disabled} textValue="webp" onSelect={() => download('webp')}
							>WEBP</DropDownMenu.Item
						>
					</DropDownMenu.Group>
					<DropDownMenu.Separator />
					<DropDownMenu.Group>
						<DropDownMenu.Item textValue="csv" onSelect={() => download('csv')}
							>CSV</DropDownMenu.Item
						>
					</DropDownMenu.Group>
				</DropDownMenu.Content>
			</DropDownMenu.Root>
		</ButtonGroup.Root>
	</Card.Footer>
</Card.Root>

{#snippet renderAxis({
	depth,
	currentRows,
	inheritedCells,
	isCategorical
}: {
	isCategorical?: boolean;
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
	{@const [axisName, max] = axesSize.entries().toArray()[depth]}
	{@const isLastAxis = depth === axesSize.size - 1}

	<!-- Only iterate over indices ('ani') that actually exist in the remaining data -->
	{@const validIndices = [...Array(max).keys()].filter((ani) =>
		currentRows.some((r) => r[axisName] === ani)
	)}

	{#each validIndices as ani, index}
		<!-- Filter data for this specific axis value -->
		{@const matchedRows = currentRows.filter((r) => r[axisName] === ani)}

		<!-- Create the cell for the current level -->
		{@const currentCell:(typeof inheritedCells)[0] = { axisName, index: ani, rowspan: matchedRows.length }}

		<!-- CRITICAL: Only pass the inherited rowspans down to the VERY FIRST child group (index === 0).
		 	Subsequent groups in this loop just render their own cell. -->
		{@const cellsToRender = index === 0 ? [...inheritedCells, currentCell] : [currentCell]}

		{#if isLastAxis}
			<!-- We hit the innermost axis. Now we actually render the Table.Rows -->
			{#each matchedRows as row, rowIndex}
				<Table.Row>
					<!-- Render the accumulated rowspans ONLY on the first row of this deepest group -->
					{#if rowIndex === 0}
						{#each cellsToRender as cell}
							<Table.Cell rowspan={cell.rowspan} class="border align-middle">
								{resolveAxisIdx(cell.axisName, cell.index)}
							</Table.Cell>
						{/each}
					{/if}

					{@const { value } = row}
					<!-- Render the leaf row values -->
					<Table.Cell class="border"
						>{isNull(value) ? 'null' : isUndefined(value) ? 'undefined' : value}</Table.Cell
					>
					{#if isCategorical}
						<Table.Cell class="border">{row.category}</Table.Cell>
					{/if}
				</Table.Row>
			{/each}
		{:else}
			<!-- Not the last axis yet. Recurse deeper! -->
			{@render renderAxis({
				depth: depth + 1,
				currentRows: matchedRows,
				inheritedCells: cellsToRender,
				isCategorical
			})}
		{/if}
	{/each}
{/snippet}

{#snippet table()}
	<Table.Root class="w-full table-auto overflow-auto">
		<Table.Caption>Tabulated {parameter.key} data</Table.Caption>

		<Table.Header>
			<Table.Row>
				{#each axesSize as [axisName]}
					<Table.Head class="border">{axisName}</Table.Head>
				{/each}
				<Table.Head class="border">value</Table.Head>
				{#if parameter.isCategorical}
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
				inheritedCells: [],
				isCategorical: parameter.isCategorical
			})}
		</Table.Body>
		<Table.Footer>
			{#if data.length}
				<Table.Row>
					{#each axesSize as [axisName] (axisName)}
						<Table.Head class="border">{axisName}</Table.Head>
					{/each}
					<Table.Head class="border">value</Table.Head>
					{#if parameter.isCategorical}
						<Table.Head class="border">category</Table.Head>
					{/if}
				</Table.Row>
			{/if}
		</Table.Footer>
	</Table.Root>
{/snippet}
