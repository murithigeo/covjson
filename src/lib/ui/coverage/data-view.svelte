<script lang="ts" module>
	import {
		type DataRow,
		type Coverage,
		CustomDate,
		isNull,
		isUndefined,
		Parameter,
		Range
	} from '#lib/core/index.ts';
	import type { ReactiveParameter } from '#lib/ui/dashboards/utils/parameter.svelte.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import {
		type AxisConfig,
		type Axis,
		resolveAxisIdx,
		resolveAxisIdxForChart,
		type DenormalizedDomain,
		download,
		type DownloadOptions
	} from './axes-utils.ts';
	import {
		LineChart,
		LinearGradient,
		Points,
		Spline,
		defaultChartPadding,
		type ChartState
	} from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropDownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { scaleOrdinal } from 'd3-scale';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { DownloadIcon, ChevronDownIcon } from '@lucide/svelte';
	import ParameterComponent from '../metadata/parameter.svelte';
	import { getRandomColor } from '#lib/utils.ts';
</script>

<script lang="ts">
	interface Props extends AxisConfig {
		data: DataRow[];
		coverage: ReturnType<Coverage['denormalize']>;
		parameter: Parameter;
		facetAll?: boolean;
		tabValue: 'chart' | 'table' | 'param-info';
		tooltip: DataRow | null;
		range: Range;
		colors?: {
			primary: string;
			categories: Map<string, string>;
		};
	}

	const initColor = getRandomColor();
	let {
		data: rows = $bindable([]),
		coverage = $bindable(),
		parameter = $bindable(),
		range = $bindable(),
		fx = $bindable(),
		x = $bindable(),
		fy = $bindable(),
		y1 = $bindable(),
		facetAll = $bindable(),
		tabValue = $bindable(range.dataType === 'string' ? 'table' : 'chart'),
		tooltip = $bindable(),
		colors = $bindable({
			primary: initColor,
			categories: new Map(parameter.categoryEncoding?.keys().map((id) => [id, initColor]))
		})
	}: Props = $props();

	let color = $derived(colors.primary);
	let axesSize = $derived(coverage.axesSize as Map<Axis, number>);
	let axisNames = $derived([...axesSize.keys()]);
	let chartRef = $state<HTMLElement>();
	let stringy = range.dataType === 'string';
	let categories = $derived(parameter.observedProperty.categories);
	let categoric = $derived<boolean>(!isUndefined(categories));
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

	let downloadFn = $derived((format: DownloadOptions['format']) =>
		download(data, {
			format,
			ref: chartRef,
			axisNames,
			filename: `coverage-${coverage.id || coverage.uuid}_${parameter.key}`,
			categoric
		})
	);
	/**
	 * Only enable when downloading & disable again
	 */
	let legend = $state(false);

	let chartConfig = $derived<Record<string, Record<'key' | 'label', string> & { color?: string }>>({
		[parameter.key]: {
			key: 'value',
			label: parameter.label.query()?.value || parameter.key,
			color: categoric ? undefined : colors.primary
		}
	});
	let context = $state<ChartState<DataRow>>();
	const setTooltip = (data: undefined | null | DataRow) => {
		if (isNull(data) || isUndefined(data)) return (tooltip = null);
		const match = rows.find((row) =>
			axisNames.every((axisName) => row[axisName] === data?.[axisName])
		);
		if (!match) return;
		tooltip = match;
	};
	$effect(() => {
		setTooltip(context?.tooltip.data);
	});

	// render a snippet to render tooltip values //https://github.com/techniq/layerchart/issues/639
</script>

<Card.Root>
	<Card.Content>
		<Tabs.Root bind:value={tabValue}>
			<Tabs.Content value="table">
				{@render table()}
			</Tabs.Content>
			<Tabs.Content value="chart">
				{#if !stringy}
					<Chart.Container config={chartConfig}>
						<LineChart
							bind:context
							bind:ref={chartRef}
							{data}
							series={Object.values(chartConfig)}
							x1={(d) => {
								if (isUndefined(y1)) return undefined;

								return resolveAxisIdxForChart(coverage.domain, y1, d[y1]);
							}}
							x={(d) => {
								return resolveAxisIdxForChart(coverage.domain, x, d[x]);
							}}
							fx={(d) => {
								if (isUndefined(fx)) return undefined;
								return resolveAxisIdxForChart(coverage.domain, fx, d[fx]);
							}}
							fy={(d) => {
								if (isUndefined(fy)) return undefined;
								return resolveAxisIdxForChart(coverage.domain, fy, d[fy]);
							}}
							facet={{
								axis: { facetAll: true }
							}}
							highlight={{ lines: true, points: true, facetAll }}
							padding={defaultChartPadding({ legend, right: 10 })}
							transform={{ mode: 'domain', axis: 'both' }}
							c={categories ? 'category' : undefined}
							cScale={categories ? scaleOrdinal() : undefined}
							cDomain={categories ? [...categories.map(({ id }) => id), ''] : undefined}
							cRange={categories
								? [...categories.map(({ id }) => colors.categories.get(id)!), color]
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
								{#if categories}
									{@const getOffset = (v: number) => yScale(v) / (height + top + bottom)}
									<LinearGradient
										vertical
										units="userSpaceOnUse"
										stops={categories
											.flatMap(({ id, values }) =>
												values.map((int): [number, string] => [int, colors.categories.get(id)!])
											)
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
										<Spline {...serie} stroke={color} />
										<Points fill={color} r={4} />
									{/each}
								{/if}
							{/snippet}
						</LineChart>
					</Chart.Container>
				{/if}
			</Tabs.Content>
			<Tabs.Content value="param-info">
				<ParameterComponent
					data={parameter}
					stats={{
						dataType: range.dataType,
						max: range.max,
						min: range.min,
						median: range.median,
						mean: range.mean,
						frequency: range.frequency
					}}
					checkable={false}
				/>
			</Tabs.Content>
		</Tabs.Root>
	</Card.Content>
	<Card.Footer class="flex w-full flex-row flex-wrap justify-center gap-2">
		<ButtonGroup.Root>
			<!-- Render the preffered format when tabValue -->
			<Button
				variant="outline"
				class="flex gap-2"
				onclick={() => {
					tabValue === 'chart' ? downloadFn('csv') : downloadFn('png');
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
						<DropDownMenu.Item {disabled} textValue="png" onSelect={() => downloadFn('png')}
							>PNG</DropDownMenu.Item
						>
						<DropDownMenu.Item {disabled} textValue="jpeg" onSelect={() => downloadFn('jpeg')}
							>JPEG</DropDownMenu.Item
						>
						<DropDownMenu.Item {disabled} textValue="webp" onSelect={() => downloadFn('webp')}
							>WEBP</DropDownMenu.Item
						>
					</DropDownMenu.Group>
					<DropDownMenu.Separator />
					<DropDownMenu.Group>
						<DropDownMenu.Item textValue="csv" onSelect={() => downloadFn('csv')}
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
								{resolveAxisIdx(coverage.domain, cell.axisName, cell.index)}
							</Table.Cell>
						{/each}
					{/if}

					{@const { value } = row}
					<!-- Render the leaf row values -->
					<Table.Cell class="border"
						>{isNull(value) ? 'null' : isUndefined(value) ? 'undefined' : value}</Table.Cell
					>
					{#if categories}
						<Table.Cell class="border">{row.category}</Table.Cell>
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

{#snippet table()}
	<Table.Root class="w-full table-auto overflow-auto">
		<Table.Caption>Tabulated {parameter.key} data</Table.Caption>

		<Table.Header>
			<Table.Row>
				{#each axesSize as [axisName]}
					<Table.Head class="border">{axisName}</Table.Head>
				{/each}
				<Table.Head class="border">value</Table.Head>
				{#if categories}
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
					{#each axesSize as [axisName] (axisName)}
						<Table.Head class="border">{axisName}</Table.Head>
					{/each}
					<Table.Head class="border">value</Table.Head>
					{#if categories}
						<Table.Head class="border">category</Table.Head>
					{/if}
				</Table.Row>
			{/if}
		</Table.Footer>
	</Table.Root>
{/snippet}
