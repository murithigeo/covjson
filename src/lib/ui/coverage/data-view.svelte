<script lang="ts" module>
	import {
		axisOptionsToList,
		type DataRow,
		isNull,
		isUndefined,
		Parameter
	} from '#lib/core/index.ts';
	import * as Card from '#lib/components/ui/card/index.ts';
	import * as Tabs from '#lib/components/ui/tabs/index.ts';
	import {
		defaultChartPadding,
		LineChart,
		type BrushDomainType,
		type LineChartProps
	} from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.ts';
	import type { ChartDimensions, Colors } from './types.d.ts';
	import TableCpt from './table.svelte';
	import Tooltip from './tooltip.svelte';
	import { getCovContext } from './ctx.svelte.ts';
	import { scaleOrdinal } from 'd3-scale';

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
	interface Props {
		view: 'chart' | 'table';
		/**
		 * See {@link HighlightPropsWithoutHTML.facetAll}
		 */
		// facetAll?: boolean;
		parameter: Parameter | string;
		colors: Colors;
		xDomain?: BrushDomainType;
	}
	let { parameter, colors, view = $bindable(), xDomain = $bindable() }: Props = $props();

	let ctx = $derived(getCovContext());
	let series = $derived(ctx.config.get('series'));
	let data = $derived(ctx.data);
	let key = $derived(typeof parameter === 'string' ? parameter : parameter.key);
	let stringy = $derived(ctx.coverage?.ranges.get(key)?.dataType === 'string');
	let categories = $derived.by(() => {
		if (typeof parameter === 'string') return undefined;
		return parameter.observedProperty.categories;
	});
	let categoric = $derived<boolean>(!isUndefined(categories));
	let color = $derived(colors[key]);
	const resolve = (dim: ChartDimensions, d: DataRow) => {
		const axis = ctx.config.get(dim);
		if (!axis) return undefined;
		return ctx.resolve(axis, d[axis] ?? 0, 'chart');
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
				label: typeof parameter === 'string' ? parameter : parameter.label.query()?.value,
				color: color.default
			}
		];
		props.y = key;
		if (series) {
			delete props.data;
			const indices = axisOptionsToList(ctx.axesSize.get(series), ctx.axisNames.get(series));
			const bySeries = Object.groupBy(data, (i) => i[series]!);
			const getLabel = (idx: number): string => {
				let label = ctx.resolve(series, idx, 'chart').toString();
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
</script>

<Card.Root>
	<Card.Content>
		<Tabs.Root
			onValueChange={(val) => {
				if (stringy && view === 'chart') view = 'table';
				else view = val as typeof view;
			}}
			value={stringy && view === 'chart' ? 'table' : view}
		>
			<Tabs.Content value="table">
				<TableCpt data={ctx.cache} {key} {categoric} />
			</Tabs.Content>
			<Tabs.Content value="chart" class="">
				{#if !stringy}
					<Chart.Container config={{}} class="">
						<LineChart
							{...chartProps}
							brush={{
								x: xDomain,
								onChange: (detail) => {
									xDomain = detail.brush.x;
								}
							}}
						>
							{#snippet tooltip({ context })}
								<Tooltip {colors} {series} {context} current={key} />
							{/snippet}
						</LineChart>
					</Chart.Container>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</Card.Content>
</Card.Root>
