<script lang="ts" module>
	import { type DataRow, CustomDate, isNull, isUndefined, Parameter } from '#lib/core/index.ts';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import {
		LineChart,
		LinearGradient,
		Spline,
		defaultChartPadding,
		type ChartState,
		type ColorProp,
		type LineChartProps,
		type SeriesData
	} from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { scaleOrdinal } from 'd3-scale';
	import { getRandomColor } from '#lib/utils.ts';
	import Downloader from './downloader.svelte';
	import type { Axis, ChartDimensions, DataViewProps } from './types';
	import TableCpt from './table-cpt.svelte';
</script>

<script lang="ts">
	let {
		data: rows = $bindable([]),
		covId,
		parameter,
		range = $bindable(),
		axesConfig = $bindable(),
		facetAll = $bindable(),
		tabValue = $bindable(),
		tooltip = $bindable(null),
		color = $bindable(),
		categoryColors = $bindable(),
		axisResolver = (a, i) => i.toString(),
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

	let chartProps = $derived.by(() => {
		let stops: [number, string][] | undefined = undefined;
		const padding = defaultChartPadding({
			right: 5,
			left: 24,
			bottom: 2,
			legend: true,

			axis: true
		});
		let props: LineChartProps<DataRow> = {
			x: (d) => resolve('x', d),
			fx: (d) => resolve('fx', d),
			fy: (d) => resolve('fy', d),
			y: 'value',
			facet: { axis: { facetAll } },
			data, // Maybe move into series,
			yPadding: [2, 10],
			xPadding: [2, 3],
			highlight: { lines: true, points: true, facetAll },
			padding,
			transform: { mode: 'domain', axis: 'both' },
			brush: true, // Bind all charts
			props: {
				tooltip: { root: { facetAll } },
				yAxis: {
					format: {
						type: 'metric',
						options: {
							notation: 'scientific'
						}
					},
					labelProps: {
						dx: (padding?.left ?? 0) - 35
					},
					get label() {
						let value: string | undefined = undefined;
						let unit: string | undefined = undefined;
						if (parameter instanceof Parameter) {
							if (parameter.unit) {
								value = parameter.unit.label.query()?.value;
								unit = parameter.unit.symbol?.value;
							}
						}
						value = value || 'Value';
						if (unit) value += ` (${unit})`;
						return value;
					}
				},
				xAxis: {
					labelProps: {
						dx: -((padding?.bottom ?? 0) + 5)
					},
					get label() {
						const an = axesConfig?.get('x');
						if (!an) return 'Axis Not Set';
						switch (an) {
							case 't':
								return 'Datetime';
							case 'z':
								return 'Elevation';
							case 'x':
							case 'y':
								return 'Cell Value';
							default:
								return 'Composite Node';
						}
					}
				}
			}
		};

		if (categories) {
			props.c = 'category';
			props.cScale = scaleOrdinal();
			props.cRange = [
				...categories.map(({ id }) => categoryColors?.get(id) || color),
				color
			].filter((v) => !isUndefined(v));
			props.cDomain = [...categories.map(({ id }) => id), ''];
			stops = categories
				.flatMap(({ id, values }) =>
					values.map((int): [number, string] => [int, categoryColors?.get(id) || color])
				)
				.sort(([a], [b]) => b - a);
		}
		props.series = [
			{
				key: 'value',
				label: typeof parameter === 'string' ? parameter : parameter.label.query()?.value
			}
		];
		const y1 = axesConfig?.get('y1');
		if (y1) {
			const groups = Object.groupBy(data, (item) => item[y1]!);
			props.series = Object.entries(groups).map(([idx, data]) => {
				let val = axisResolver(y1, Number(idx)).toString();
				if (y1 === 'z') val += 'm';
				return {
					label: val,
					key: `y1-${idx}`, //Not really needed
					data
				};
			});
			delete props.data;
		}
		// console.log(props);
		return { props, stops };
	});

	const getColor = (v: number | undefined): string => {
		if (typeof parameter === 'string' || !parameter.observedProperty.categories || isUndefined(v))
			return color;
		const catId = parameter.getCategory(v)?.id;
		if (!catId) return color;
		return categoryColors?.get(catId) || color;
	};
	let context = $state<ChartState<DataRow>>();
	const setTooltip = (data: undefined | null | DataRow): void => {
		if (isNull(data) || isUndefined(data)) {
			tooltip = null;
			return;
		}
		const match = rows.find((row) => axes.every(([an]) => row[an] === data?.[an]));
		tooltip = match || null;
	};

	$effect(() => {
		setTooltip(context?.tooltip.data);
	});

	const resolve = (dimension: ChartDimensions, dataRow: DataRow) => {
		const axis = axesConfig?.get(dimension);
		if (!axis) return undefined;
		const idx = dataRow[axis] || 0;
		return axisResolver(axis, idx, 'chart');
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
				<TableCpt bind:data {axes} {key} {axisResolver} {categoric} />
			</Tabs.Content>
			<Tabs.Content value="chart">
				{#if !stringy}
					<Chart.Container config={{}}>
						<LineChart bind:context bind:ref={chartRef} {...chartProps.props}>
							{#snippet tooltip({ context: { tooltip } })}
								<Chart.Tooltip
									labelFormatter={(d) => (d instanceof CustomDate ? d.value : d)}
									{facetAll}
									color={getColor(tooltip.data.value)}
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
										stops={chartProps.stops?.map(([int, color]): [number, string] => [
											getOffset(int),
											color
										])}
										>{#snippet children({ gradient })}
											{#each series.visibleSeries as serie (serie.key)}
												{@render spline({ ...serie, stroke: gradient, color: gradient })}
											{/each}
										{/snippet}
									</LinearGradient>
								{:else}
									{#each series.visibleSeries as serie (serie.key)}
										{@render spline({ ...serie, color })}
									{/each}
								{/if}
							{/snippet}
						</LineChart>
					</Chart.Container>
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

{#snippet spline(data: SeriesData<any, any> & { stroke?: ColorProp })}
	<Spline
		class={(d) => (isNull(d) ? 'stroke-2 [stroke-dasharray:4_4]' : 'stroke-2')}
		{...data}
		markerMid={{ type: 'circle', size: 6 }}
	/>
{/snippet}
