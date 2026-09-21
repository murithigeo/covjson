<script module lang="ts">
	import { Coverage, CustomDate, isNull, isUndefined } from '@murithigeo/covjson-core';
	import {
		LineChart,
		LinearGradient,
		Spline,
		ChartGroup,
		defaultChartPadding,
		Points
	} from 'layerchart';

	import { scaleOrdinal } from 'd3-scale';
	import EmptyChart from '$lib/empty/chart.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
</script>

<script lang="ts">
	import { getCoverageCtx } from '$lib/coverage/coverage-ctx.svelte.js';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';

	interface Props {
		coverage: Coverage;
		ref: HTMLElement | null;
	}
	let { coverage = $bindable(), ref = $bindable(null) }: Props = $props();
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
	let config = $derived(ctx.chartConfig);
	let x = $derived(cCtx.x);
	let y1 = $derived(cCtx.y1);
	let series = $derived(Object.values(config).map(({ color, ...props }) => props));
	/**
	 * Should be remapped as t if composite is xAxis
	 */

	let data = $derived(
		coverage.query(
			cCtx.indices,
			[...ctx.selected],
			[x, y1].filter((x) => !isUndefined(x)),
			true
		)
	);

	function y1DomainStream() {}
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
						<Chart.Container {config}>
							{@const catic = parameter.isCategorical}
							<LineChart
								id={key}
								{data}
								x={['Section', 'Trajectory'].includes(coverage.domainType!) ? 't' : x}
								{series}
								y1={(d) => {
									console.log({ d });
									return undefined;
								}}
								brush
								c={catic ? `${key}:category` : undefined}
								cScale={catic ? scaleOrdinal() : undefined}
								cDomain={catic
									? [...parameter.categories.entries().map(([id]) => id), 'NULL']
									: undefined}
								cRange={catic
									? [
											...parameter.categories
												.entries()
												.map(([, { color = parameter.color }]) => color),
											parameter.color
										]
									: undefined}
								transform={{ mode: 'domain', axis: 'both' }}
								padding={defaultChartPadding({ top: 40 })}
								legend={{ placement: 'top-right', variant: 'swatches' }}
								yDomain={[parameter.min, isNull(parameter.max) ? null : parameter.max * 1.2]}
							>
								{#snippet tooltip({ context })}
									{@const data = context.tooltip.data?.[`${key}:category`]}

									{@render CustomTooltip({
										color: data ? parameter.getCategory(data)?.color : parameter.color
									})}
								{/snippet}
								{#snippet marks({ context: { height, padding, yScale } })}
									{#if catic}
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
												<Points fill={gradient} r={3} />
											{/snippet}
										</LinearGradient>
									{:else}
										<Spline stroke={parameter.color} />
										<Points fill={parameter.color} r={3} />
									{/if}
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
	<Chart.Tooltip {color} labelFormatter={(d) => (d instanceof CustomDate ? d.value : d)} />
{/snippet}
