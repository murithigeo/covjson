<script module lang="ts">
	import { Coverage, CustomDate } from '@murithigeo/covjson-core';
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
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
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
						{@const scale = scale}
						<Chart.Container config={ctx.chartConfig}>
							<LineChart
								brush={{ axis: 'both' }}
								transform={{ mode: 'domain', axis: 'both' }}
								padding={defaultChartPadding({ top: 40 })}
								data={data.map((row) => {
									const value = row[key] as number | string | null;
									const category = parameter.getCategoryId(value)?.id || 'default';

									return { [x]: row[x], value, category };
								})}
								{x}
								c="category"
								y="value"
								legend={{ placement: 'top-right', variant: 'ramp' }}
								cScale={scaleOrdinal()}
								cDomain={parameter.categories
									.entries()
									.toArray()
									.flatMap(([, { values }]) => values)
									.sort((a, b) => a - b)}
								cRange={parameter.categories
									.entries()
									.toArray()
									.flatMap(([, { color = parameter.color, values }]) =>
										values.map((int) => [int, color])
									)
									.map(([, color]) => color)}
							>
								{#snippet tooltip()}{@render CustomTooltip()}
								{/snippet}
								{#snippet marks({ context })}
									{@const getOffset = (v: number) =>
										context.yScale(v) /
										(context.height + context.padding.top + context.padding.bottom)}
									<LinearGradient
										stops={parameter.categories
											.entries()
											.toArray()
											.flatMap(([, { color = parameter.color, values }]): ColorStop[] =>
												values.map((int) => [int, color])
											)
											.map(([int, color]): ColorStop => [getOffset(int), color])
											.sort(([a], [b]) => a - b)}
										vertical
										units="userSpaceOnUse"
									>
										{#snippet children({ gradient })}
											<Spline
												stroke={gradient}
												defined={(d) => d.value !== null && d.value !== undefined}
											/>
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

{#snippet CustomTooltip()}
	<Chart.Tooltip labelFormatter={(value) => (value instanceof CustomDate ? value.value : value)} />
{/snippet}
