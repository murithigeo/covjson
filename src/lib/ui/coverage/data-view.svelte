<script lang="ts" module>
	import { type DataRow, CustomDate, isNull, isUndefined } from '#lib/core/index.ts';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import {
		LineChart,
		LinearGradient,
		Points,
		Spline,
		defaultChartPadding,
		type ChartState
	} from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { scaleOrdinal } from 'd3-scale';
	import ParameterComponent from '../metadata/parameter-cpt.svelte';
	import { getRandomColor } from '#lib/utils.ts';
	import Stats from '../metadata/parameter/stats.svelte';
	import Downloader from './downloader.svelte';
	import type { Axis, ChartDimensions, DataViewProps } from './types';
	import TableCpt from './table-cpt.svelte';
</script>

<script lang="ts">
	const _color = getRandomColor();
	let {
		data: rows = $bindable([]),
		covId,
		show,
		parameter,
		range = $bindable(),
		axesConfig = $bindable(),
		facetAll = $bindable(),
		tabValue = $bindable(),
		tooltip = $bindable(null),
		color = $bindable(_color),
		categoryColors = $bindable(),
		axisResolver = (a, i) => i,
		axes = $bindable(range.axisNames.map((axisName, i) => [axisName as Axis, range.shape[i]]))
	}: DataViewProps = $props();

	let _parameter = $derived(typeof parameter === 'string' ? undefined : parameter);
	let key = $derived(typeof parameter === 'string' ? parameter : parameter.key);
	let chartRef = $state<HTMLElement>();

	let stringy = range.dataType === 'string';
	let categories = $derived.by(() => {
		if (typeof parameter === 'string') return undefined;
		return parameter.observedProperty.categories;
	});
	let categoric = $derived<boolean>(!isUndefined(categories));

	let data = $derived(
		rows.map((r) => {
			const d: DataRow = {};
			for (const [axisName] of axes) d[axisName] = r[axisName];
			d.value = r[key];
			if (categoric) d.category = _parameter?.getCategory(d.value as number)?.id || '';
			return d;
		})
	);

	/**
	 * Only enable when downloading & disable again
	 */
	let legend = $state(false);

	let chartConfig = $derived<Record<string, Record<'key' | 'label', string> & { color?: string }>>({
		[key]: {
			key: 'value',
			label: _parameter?.label.query()?.value || key,
			color: categoric ? undefined : color
		}
	});
	let context = $state<ChartState<DataRow>>();
	const setTooltip = (data: undefined | null | DataRow) => {
		if (isNull(data) || isUndefined(data)) return (tooltip = null);
		const match = rows.find((row) =>
			axes.every(([axisName]) => row[axisName] === data?.[axisName])
		);
		if (!match) return;
		tooltip = match;
	};
	$effect(() => {
		setTooltip(context?.tooltip.data);
	});

	const resolveAxisIdxForChart = (field: ChartDimensions, row: DataRow) => {
		const axisName = axesConfig?.get(field);
		if (isUndefined(axisName)) return undefined;
		const idx = row[axisName];
		if (isUndefined(idx)) return undefined;
		let value = axisResolver(axisName, idx as number);
		if (Array.isArray(value)) {
			if (typeof value[0] === 'string') value = value[0];
			else value = idx;
		}
		if (typeof value === 'string') return new CustomDate(value);
		return value;
	};
</script>

<Card.Root>
	<Card.Content>
		<Tabs.Root
			bind:value={
				() => (stringy && tabValue === 'chart' ? 'table' : tabValue),
				(t) => (tabValue = stringy ? 'table' : t)
			}
		>
			<Tabs.Content value="table">
				<TableCpt bind:data {axes} {key} {axisResolver} />
			</Tabs.Content>
			<Tabs.Content value="chart">
				{#if !stringy}
					<Chart.Container config={chartConfig}>
						<LineChart
							bind:context
							bind:ref={chartRef}
							{data}
							series={Object.values(chartConfig)}
							x={(d) => resolveAxisIdxForChart('x', d)}
							fx={(d) => resolveAxisIdxForChart('fx', d)}
							fy={(d) => resolveAxisIdxForChart('fy', d)}
							facet={{
								axis: { facetAll }
							}}
							highlight={{ lines: true, points: true, facetAll }}
							padding={defaultChartPadding({ legend, right: 10 })}
							transform={{ mode: 'domain', axis: 'both' }}
							c={categories ? 'category' : undefined}
							cScale={categories ? scaleOrdinal() : undefined}
							cDomain={categories ? [...categories.map(({ id }) => id), ''] : undefined}
							cRange={categories
								? [...categories.map(({ id }) => categoryColors?.get(id) || color), color]
								: undefined}
							brush
							props={{
								tooltip: { root: { facetAll } },
								labels: {
									/// Add labels dependent on axis label
								}
							}}
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
												values.map((int): [number, string] => [
													int,
													categoryColors?.get(id) || color
												])
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
				{#if show?.parameters && _parameter}
					<ParameterComponent
						data={_parameter}
						stats={range}
						checkable={false}
						{color}
						onColorChange={(_, col, catId) => {
							if (!catId) return (color = col);
							categoryColors?.set(catId, color);
						}}
					/>
				{:else}
					<Stats {...range} class="grid grid-cols-2 gap-1" />
				{/if}
			</Tabs.Content>
			<Tabs.Content value="download">
				<Downloader
					bind:ref={chartRef}
					bind:data
					axisNames={axes.map(([name]) => name)}
					{axisResolver}
					{categoric}
					filename="coverage-{covId}_{key}"
				/>
			</Tabs.Content>
		</Tabs.Root>
	</Card.Content>
</Card.Root>
