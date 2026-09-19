<script module lang="ts">
	import { Coverage, CustomDate, type DataRow } from '@murithigeo/covjson-core';
	import {
		LineChart,
		LinearGradient,
		Spline,
		type ChartState,
		ChartGroup,
		defaultChartPadding
	} from 'layerchart';

	import { scaleOrdinal, scaleThreshold } from 'd3-scale';
	import EmptyChart from '$lib/empty/chart.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ReactiveParameter, CategoryState } from '$lib/dashboards/utils/parameter.svelte.js';
</script>

<script lang="ts">
	import { getCoverageCtx } from '$lib/coverage/coverage-ctx.svelte.js';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';

	interface Props {
		coverage: Coverage;
	}
	let { coverage = $bindable() }: Props = $props();
	const ctx = getDashCtx();
	const cCtx = getCoverageCtx();

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

	type ColorStop = [number, string];
	let parameters = $derived.by<[string, ReactiveParameter][]>(() => {
		return ctx.parameters
			.entries()
			.filter(([key]) => coverage.ranges.has(key))
			.filter(([key]) => ctx.selected.has(key))
			.toArray();
	});
	/**
	 * Should be remapped as t if composite is xAxis
	 */
	let x = $derived(cCtx.xAxis);
	let data = $derived.by(() => {
		const rangeIds = parameters.map(([key]) => key);
		return coverage.query(cCtx.indices, rangeIds, [x]);
	});
	let series = $derived(
		parameters.map(([key, param]) => ({ key, color: param.color, label: param.simpleLabel }))
	);
	function getCategory(
		data: DataRow | null,
		parameter: ReactiveParameter
	): CategoryState | undefined {
		data = data || {};
		const value = data[parameter.key];
		if (value === null) return undefined;
		return parameter.getCategoryId(value as number);
	}

	function computeLineSeriesProps(parameter: ReactiveParameter, data: DataRow[]) {
		const props: LineChartProps<DataRow>;

		return props;
	}
</script>

<div class="grid-cols-1 items-center">
	{#await data}
		<EmptyChart status="loading" />
	{:then data}
		{#if !data.length}
			<EmptyChart status="loaded" />
		{:else}
			<ChartGroup>
				<div class="flex flex-col">
					{#each parameters as [key, parameter]}
						<Chart.Container config={ctx.chartConfig}>
							<LineChart
								{data}
								{x}
								{series}
								y={key}
								brush={{ axis: 'both' }}
								transform={{ mode: 'domain', axis: 'both' }}
								padding={defaultChartPadding({ top: 40 })}
								c={parameter.isCategorical
									? (row: DataRow) => getCategory(row, parameter)?.color
									: undefined}
								legend={{ placement: 'top-right' }}
								cDomain={parameter.isCategorical
									? parameter.categories
											.keys()
											.toArray()
											.sort((a, b) => a.localeCompare(b))
									: undefined}
								cRange={parameter.categories
									.entries()
									.toArray()
									.sort(([a], [b]) => a.localeCompare(b))
									.map(([, { color = parameter.color }]) => color)}
							>
								{#snippet tooltip({ context })}
									{@render CustomTooltip({})}
								{/snippet}
								{#snippet marks({ context: { height, padding, yScale } })}
									{@const getOffset = (v: number) =>
										yScale(v) / (height + padding.top + padding.bottom)}
									<LinearGradient
										stops={parameter.categories
											.entries()
											.toArray()
											.flatMap(([, { color = parameter.color, values }]): ColorStop[] =>
												values.map((int) => [int, color])
											)
											.sort(([a], [b]) => b - a)
											.map(([int, color]): ColorStop => [getOffset(int), color])}
										vertical
										units="userSpaceOnUse"
									>
										{#snippet children({ gradient })}
											<Spline stroke={gradient} />
										{/snippet}
									</LinearGradient>
								{/snippet}
							</LineChart>
						</Chart.Container>
					{/each}
				</div>
			</ChartGroup>
		{/if}
	{/await}
</div>

{#snippet CustomTooltip({ color }: { color?: string })}
	<Chart.Tooltip
		{color}
		labelFormatter={(value) => (value instanceof CustomDate ? value.value : value)}
	/>
{/snippet}
