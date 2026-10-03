<script lang="ts" module>
	import * as Chart from '$lib/components/ui/chart/index.js';
	import {
		Coverage,
		type OnIndicesChange,
		isUndefined,
		isNull,
		CustomDate,
		type DataRow
	} from '@murithigeo/covjson-core';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { TrashIcon, PinIcon, HardDriveDownloadIcon, PinOffIcon } from '@lucide/svelte';
	import {
		LineChart,
		LinearGradient,
		Points,
		Spline,
		defaultChartPadding,
		type ChartState,
		downloadImage
	} from 'layerchart';
	import dimensions, { type Axis } from './dimensions.ts';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { scaleOrdinal } from 'd3-scale';
	import { SvelteMap } from 'svelte/reactivity';
</script>

<script lang="ts">
	interface Props {
		coverage: Coverage;
		onIndicesChange?: OnIndicesChange;
		/**
		 * Initial value to set whether coverage is highlighted
		 */
		checked?: boolean;
	}

	let { coverage = $bindable(), onIndicesChange = $bindable() }: Props = $props();
	const ctx = getDashCtx();
	/**
	 * View data as chart. By default, if parameter is string/float, then it will be first rendered as a chart
	 * Else It will be a table
	 */
	let viewAsChart = new SvelteMap<string, boolean>();
	for (const [key, range] of coverage.ranges) {
		if (!ctx.parameters.has(key) && coverage.parameters.has(key)) {
			ctx.setParameter(key, coverage.parameters.get(key)!);
		}
		if (range.type === 'NdArray') {
			ctx.updateRangeData(key, coverage.uuid, range);
		}
		range.options = {
			...range.options,
			onNonCacheFetch(value) {
				range.options.onNonCacheFetch?.(value);
				ctx.updateRangeData(key, coverage.uuid, range);
			}
		};
		coverage.ranges.set(key, range);
	}

	const setParameterViewMode = (parameter: ReactiveParameter, checked: boolean) => {
		const { key } = parameter;
		if (parameter.dataType === 'string') return viewAsChart.set(key, false);
		viewAsChart.set(key, checked);
	};
	let domain = coverage.domain.clone()?.denormalize();

	const ds = dimensions(domain);

	let x = $state(ds.x);
	let fx = $state<(typeof ds)['fx']>();
	let fy = $state<Axis>();
	let y1 = $state<Extract<Axis, 't' | 'z'>>();
	let facetAll = $state(false);

	let parameters = $derived.by<[string, ReactiveParameter][]>(() =>
		ctx.parameters
			.entries()
			.filter(([key]) => coverage.ranges.has(key))
			.filter(([key]) => ctx.selected.has(key))
			.toArray()
	);

	let rows = $state<Record<string, DataRow[]>>({});
	const axesSize = coverage.axesSize as Map<Axis, number>;
	function promiseToData(data: DataRow[]): void {
		for (const [key, parameter] of parameters) {
			rows[key] = data.map((d) => {
				const row = { ...d };
				const value = row[key];
				parameters.forEach(([k]) => delete row[k]);
				row.value = value;

				if (parameter.isCategorical) {
					row.category = parameter.getCategory(value as number)?.id || 'NULL';
				}

				return row;
			});
		}
	}

	let dataPromise = $derived.by(() => {
		const preloadAxis = [...new Set([fx, fy, x, y1])].filter((v) => !isUndefined(v));
		const rangeIds = parameters.map(([key]) => key);
		coverage.query(coverage.indices, rangeIds, preloadAxis).then((rows) => promiseToData(rows));
	});
	let context = $state<ChartState>();

	$effect(() => {
		const data: DataRow = context?.tooltip.data;
		if (!data) return;
		const indices = new Map<string, number>();
		for (const [axisName, idx] of coverage.indices) {
			indices.set(axisName, (data[axisName + `$:{index}`] as number) || idx);
		}
		onIndicesChange?.(coverage, new Map(indices));
	});

	$effect(() => {
		dataPromise;
	});
	type DownloadFormat = 'csv' | 'png';
	function onDownloadClick(parameterkey: string, format: DownloadFormat) {
		for (const [key] of parameters) {
			const id = `${coverage.uuid}-${key}`;
			const ref = document.getElementById(id);
			if (!ref) continue;
			// ref.legend = true;
			downloadImage(ref, { filename: id });
		}
	}

	function resolveAxisIdx(axis: Axis, idx: number) {
		if (axis === 'z' || axis === 't') return coverage[axis][idx];
		// @ts-expect-error domain is denormalized
		if (axis in domain.axes) return domain.axes[axis]?.values[idx];
	}

	/**
	 * AI-generated  by Google Gemini
	 */
	interface Cell {
		/**
		 * Current axis index
		 */
		index: number;
		/**
		 * The rowspan of the axis name index
		 */
		rowspan: number;
		axisName: Axis;
	}
	/**
	 * https://stackoverflow.com/a/31536517
	 */
	const rowsToCsv = (rows: DataRow[]) => {
		const axisNames = [...axesSize.keys()];
		const header = [...axisNames, 'value', 'category'];
		return [
			header.join(','),
			...rows.map((row) =>
				header.map((fieldName) => {
					let value: unknown = row[fieldName];
					//@ts-expect-error fieldName should Axis
					if (axisNames.includes(fieldName)) value = resolveAxisIdx(fieldName, value);
					return JSON.stringify(value, (k, v) => (isUndefined(v) || isNull(v) ? '' : value));
				})
			)
		].join('\r\n');
	};
</script>

<Card.Root>
	<Card.Header>
		<Card.Title><Badge variant="outline">{coverage.domain.domainType}</Badge></Card.Title>
		<Card.Description class="flex space-x-2">
			<div class="flex items-center space-x-2">
				<Switch
					checked={fx === ds.fx}
					disabled={!ds.fx}
					onCheckedChange={(checked) => {
						if (checked) fx = ds.fx;
						else fx = undefined;
					}}
				/>
				<Label>{ds.fx}</Label>
			</div>
			<Separator orientation="vertical" />
			<div class="flex items-center space-x-2">
				<Switch
					checked={fy === ds.fy}
					disabled={!ds.fy}
					onCheckedChange={(checked) => {
						if (checked) fy = ds.fy;
						else fy = undefined;
					}}
				/>
				<Label>{ds.fy}</Label>
			</div>
			<Separator orientation="vertical" />

			<div class="flex items-center space-x-2">
				<Switch
					checked={y1 === ds.y1}
					disabled={!ds.y1}
					onCheckedChange={(checked) => {
						if (checked) y1 = ds.y1;
						else y1 = undefined;
					}}
				/>
				<Label>{ds.y1}</Label>
			</div>
			<Separator orientation="vertical" />

			<div class="flex items-center space-x-2">
				<Switch bind:checked={facetAll} />
				<Label>facetAll</Label>
			</div>
		</Card.Description>
		<Card.Action>
			<ButtonGroup.Root>
				<Button size="icon-sm" variant="outline">
					<!-- Download as CSV, add a new line between parameters -->
					<HardDriveDownloadIcon /></Button
				>
				<Button
					size="icon-sm"
					variant="outline"
					onclick={() => ctx.updateCoveragePinStatus(coverage)}
					>{#if ctx.pinned.has(coverage.uuid)}
						<PinOffIcon />{:else}<PinIcon />
					{/if}</Button
				>
				<Button
					size="icon-sm"
					variant="outline"
					onclick={() => ctx.trashCoverage(coverage)}
					disabled={ctx.pinned.has(coverage.uuid)}><TrashIcon /></Button
				>
			</ButtonGroup.Root>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<Tabs.Root value={'STRINGBS'}>
			<Tabs.List>
				{#each parameters as [value], i (i)}
					<Tabs.Trigger {value}>{value}</Tabs.Trigger>
				{/each}
			</Tabs.List>
			{#each parameters as [key, parameter], i (i)}
				{@const data = rows[key] || []}
				<Tabs.Content value={key}>
					<Card.Root>
						<Card.Content>
							{#if viewAsChart.get(key)}
								{@const catic = parameter.isCategorical}
								<Chart.Container config={ctx.chartConfig}>
									<LineChart
										id="{coverage.uuid}-{key}"
										{data}
										series={[
											{
												key: 'value',
												label: parameter.simpleLabel,
												color: catic ? undefined : parameter.color
											}
										]}
										y1={(d) => {
											if (isUndefined(y1)) return undefined;
											return coverage[y1][d[y1]];
										}}
										x={(d) => {
											if (x === 'z') return d.z;
											if (x === 'composite') return new CustomDate(coverage.t[d.composite]);
											return new CustomDate(coverage.t[d.t]);
										}}
										fx={(d) => {
											if (isUndefined(fx)) return undefined;
											if (coverage.domain.domainType === 'Grid') {
												if (fx === 'x' || fx === 'y') return coverage.domain[fx][d[fx]];
											}
											if (fx === 'composite') return coverage.t[d[fx]];
										}}
										fy={(d) => {
											if (isUndefined(fy)) return undefined;
											if (coverage.domain.domainType === 'Grid') {
												if (fy === 'x' || fy === 'y') return coverage.domain[fy][d[fy]];
											}
											if (fy === 'composite') return coverage.t[d[fy]];
										}}
										// legend
										// bind:context
										facet={{
											axis: { facetAll: true }
										}}
										highlight={{ lines: true, points: true, facetAll }}
										padding={defaultChartPadding({ legend: true, right: 10 })}
										transform={{ mode: 'domain', axis: 'both' }}
										c={catic ? 'category' : undefined}
										cScale={catic ? scaleOrdinal() : undefined}
										cDomain={catic
											? [...parameter.categories.entries().map(([id]) => id), 'NULL']
											: undefined}
										cRange={catic
											? [
													...parameter.categories
														.values()
														.map(({ color = parameter.color }) => color),
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
											{#if catic}
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
							{:else}
								{@render table({ data, parameter })}
							{/if}
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
							<div class="flex items-center space-x-2">
								<Switch
									disabled={parameter.dataType === 'string'}
									onCheckedChange={(checked) => setParameterViewMode(parameter, checked)}
								/><Label>Chart</Label>
							</div>
							<!-- Download buttons -->
							<ButtonGroup.Root></ButtonGroup.Root>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Card.Content>
</Card.Root>

{#snippet table({ data, parameter }: { data: DataRow[]; parameter: ReactiveParameter })}
	<Table.Root class="table-auto">
		<Table.Caption>Tabulated {parameter.key} data</Table.Caption>

		<Table.Header>
			<Table.Row>
				{#each coverage.axesSize as [axisName]}
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
          Recursive snippet that drills down through coverage.axesSize 
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
					{#each coverage.axesSize as [axisName] (axisName)}
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

{#snippet renderAxis({
	depth,
	currentRows,
	inheritedCells,
	isCategorical
}: {
	isCategorical?: boolean;
	depth: number;
	currentRows: DataRow[];
	inheritedCells: Cell[];
})}
	{@const [axisName, max] = axesSize.entries().toArray()[depth]}
	{@const isLastAxis = depth === coverage.axesSize.size - 1}

	<!-- Only iterate over indices ('ani') that actually exist in the remaining data -->
	{@const validIndices = [...Array(max).keys()].filter((ani) =>
		currentRows.some((r) => r[axisName] === ani)
	)}

	{#each validIndices as ani, index}
		<!-- Filter data for this specific axis value -->
		{@const matchedRows = currentRows.filter((r) => r[axisName] === ani)}

		<!-- Create the cell for the current level -->
		{@const currentCell:Cell = { axisName, index: ani, rowspan: matchedRows.length }}

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

					<!-- Render the leaf row values -->
					<Table.Cell class="border">{row.value}</Table.Cell>
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
