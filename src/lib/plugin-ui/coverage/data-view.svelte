<script lang="ts" module>
	import { axisOptionsToList, type DataRow, isNull, isUndefined } from '#lib/core/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import { defaultChartPadding, LineChart, type LineChartProps } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import type { ChartDimension, DataViewProps, FormatWithUnit } from '../types.js';
	import TableCpt from './table.svelte';
	import Tooltip from './tooltip.svelte';
	import { scaleOrdinal } from 'd3-scale';
	import Parameter from '../Parameter.svelte';

	const _chartProps: LineChartProps<DataRow> = {
		transform: { mode: 'domain', axis: 'both' },
		brush: true,
		yNice: true,
		highlight: { lines: true, points: { r: 6 }, axis: 'both' },
		points: { r: 4 },
		legend: true
	};

	const padding = 24;
</script>

<script lang="ts">
	let {
		colors,
		view = $bindable(),
		data,
		cache,
		config,
		tooltip: tooltip_ = $bindable(),
		xDomain = $bindable(),
		axisNames,
		resolver,
		parameter: _key,
		axesSize,
		format: formatVal,
		rangeIds,
		info
	}: DataViewProps = $props();

	let series = $derived(config.series);
	let parameter = $derived(typeof _key === 'string' ? undefined : _key);
	let key = $derived(typeof _key === 'string' ? _key : _key?.key);
	let stringy = $derived(info?.['data-type'] === 'string');
	let categories = $derived(parameter?.observedProperty.categories);
	let categoric = $derived<boolean>(!isUndefined(categories));

	let color = $derived(colors[key]);
	let totalSize = $derived(info?.totalSize);
	const resolve = (dim: ChartDimension, d: DataRow) => {
		const axis = config[dim];
		if (!axis) return undefined;
		return resolver(axis, d[axis] ?? 0, 'chart');
	};

	let chartProps = $derived.by(() => {
		const props = {
			..._chartProps,
			padding: defaultChartPadding({
				top: padding,
				axis: true,
				legend: true,
				left: padding,
				right: padding
			})
		};
		props.data = data;
		props.x = (d) => resolve('x', d);
		props.fx = (d) => resolve('fx', d);
		props.fy = (d) => resolve('fy', d);
		props.yPadding = [4, 5];
		props.props = {
			spline: {
				class: (d) => (isNull(d[key]) ? 'stroke-2 [stroke-dasharray:4_4]' : 'stroke-2')
			},
			yAxis: {
				format: {
					type: 'metric',
					options: {
						notation: 'scientific'
					}
				}
			}
		};
		if (categories && Object.keys(color).length > 1) {
			props.c = `${key}:cat`;
			props.cScale = scaleOrdinal();
			props.cRange = [
				...categories.map(({ id }) => color[id] || color.default),
				color.default
			].filter((v) => !isUndefined(v));
			props.cDomain = [...categories.map(({ id }) => id), ''];
		}

		props.series = [
			{
				key,
				label: parameter?.label.query()?.value || key,
				color: color.default
			}
		];
		props.y = key;
		if (series) {
			delete props.data;
			const indices = axisOptionsToList(axesSize.get(series), axisNames[series]);
			const bySeries = Object.groupBy(data, (i) => i[series]!);
			const getLabel = (idx: number): string => {
				let label = resolver(series, idx, 'chart').toString();
				if (series === 'z') label += 'm';
				return label;
			};
			props.series = indices.map((idx) => ({
				data: bySeries[idx] || [],
				key: String(idx),
				label: getLabel(idx),
				color: color.default
			}));
		}
		return props;
	});
	const format: FormatWithUnit = (k, v) => {
		if (k === key) return parameter?.unit?.format(v);
		return formatVal?.(k, v);
	};
</script>

<Card.Root>
	<Card.Content>
		<Tabs.Root bind:value={view}>
			<Tabs.Content value="table">
				<TableCpt data={cache} {key} {categoric} {axesSize} {resolver} {totalSize} />
			</Tabs.Content>
			<Tabs.Content value="chart">
				{#if !stringy}
					<Chart.Container config={{}}>
						<LineChart
							yNice
							{...chartProps}
							brush={{
								x: xDomain,
								onChange: (detail) => {
									xDomain = detail.brush.x;
								}
							}}
						>
							{#snippet tooltip({ context })}
								<Tooltip
									{colors}
									{series}
									{context}
									active={key}
									{data}
									bind:tooltip={tooltip_}
									{resolver}
									{format}
									{axesSize}
									{rangeIds}
								/>
							{/snippet}
						</LineChart>
					</Chart.Container>
				{:else}
					<TableCpt data={cache} {key} {categoric} {axesSize} {resolver} {totalSize} />
				{/if}
			</Tabs.Content>
			{#if parameter}
				<Tabs.Content value="parameter">
					<Parameter data={parameter} stats={info} />
				</Tabs.Content>
			{/if}
		</Tabs.Root>
	</Card.Content>
</Card.Root>
