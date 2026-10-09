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
	import type { Axis, DataViewProps } from './types';
	import { SvelteMap } from 'svelte/reactivity';
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
		fx = $bindable(),
		x = $bindable(),
		fy = $bindable(),
		y1 = $bindable(),
		facetAll = $bindable(),
		tabValue = $bindable(range.dataType === 'string' ? 'table' : 'chart'),
		tooltip = $bindable(null),
		color = $bindable(_color),
		categoryColors = $bindable(
			new SvelteMap(
				typeof parameter === 'string'
					? undefined
					: parameter.observedProperty.categories?.map(({ id }) => [id, color])
			)
		),
		axisResolver = (a, i) => i,
		axes = $bindable(
			range.axisNames.map((name, i): [Axis, number] => [name as Axis, range.shape[i]])
		)
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
	const resolveAxisIdxForChart = (axisName: Axis, idx: number) => {
		let value = axisResolver(axisName, idx);
		if (Array.isArray(value)) {
			if (typeof value[0] === 'string') value = value[0];
			else value = idx;
		}
		if (typeof value === 'string') return new CustomDate(value);
		return value;
	};
	// render a snippet to render tooltip values //https://github.com/techniq/layerchart/issues/639
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
							// x1={(d) => {
							// 	if (isUndefined(y1)) return undefined;

							// 	return resolveAxisIdxForChart(y1, d[y1]);
							// }}
							x={(d) => resolveAxisIdxForChart(x, d[x])}
							fx={(d) => {
								if (isUndefined(fx)) return undefined;
								return resolveAxisIdxForChart(fx, d[fx]);
							}}
							fy={(d) => {
								if (isUndefined(fy)) return undefined;
								return resolveAxisIdxForChart(fy, d[fy]);
							}}
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
								? [...categories.map(({ id }) => categoryColors.get(id)!), color]
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
												values.map((int): [number, string] => [int, categoryColors.get(id)!])
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
							categoryColors.set(catId, color);
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
