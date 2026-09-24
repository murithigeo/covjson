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
	import {
		LineChart,
		LinearGradient,
		Points,
		Spline,
		ChartGroup,
		defaultChartPadding,
		ChartGroupState,
		type ChartState
	} from 'layerchart';
	import { getDashCtx } from '$lib/dashboards/utils/ctx.svelte.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { DomainTypes, MultiPolygon, Section, Trajectory } from 'coveragejson';
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
	import EmptyChart from '$lib/empty/chart.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { scaleOrdinal, scaleUtc } from 'd3-scale';
</script>

<script lang="ts">
	interface Props {
		coverage: Coverage;
		onIndicesChange: OnIndicesChange;
	}

	let { coverage = $bindable(), onIndicesChange = $bindable() }: Props = $props();

	const ctx = getDashCtx();
	type Axis = 't' | 'composite' | 'z' | 'x' | 'y';

	let xFacet = $state<boolean>(false);
	let yFacet = $state<boolean>(false);

	let x = $derived.by<Axis>(() => {
		switch (coverage.domain.domainType!) {
			case 'VerticalProfile':
			case 'Section':
				return 'z';
			case 'MultiPointSeries':
			case 'MultiPolygonSeries':
			case 'PolygonSeries':
			case 'PointSeries':
				return 't';
			case 'Trajectory':
				return 'composite';
			case 'MultiPoint':
			case 'MultiPolygon':
			case 'Point':
			case 'Polygon':
			case 'Grid':
				if (coverage.t.length) return 't';
				return 'z';
		}
	});
	let fx = $derived.by<Axis | undefined>(() => {
		if (!xFacet) return undefined;
		switch (coverage.domain.domainType) {
			case 'Grid':
				return 'x';
			case 'Section':
			case 'MultiPoint':
			case 'MultiPointSeries':
			case 'MultiPolygon':
			case 'Trajectory':
			case 'MultiPolygonSeries':
				return 'composite';
		}
	});
	let fy = $derived.by<Axis | undefined>(() => {
		if (!yFacet) return undefined;
		switch (coverage.domain.domainType) {
			case 'Grid':
				return 'y';
		}
	});

	let y1 = $derived.by<Exclude<Axis, 'composite' | 'x' | 'y'> | undefined>(() => {
		return undefined;
		switch (coverage.domain.domainType) {
			case 'Grid':
				if (x === 't') return 'z';
				if (x === 'z') return 't';
		}
	});

	let parameters = $derived.by<[string, ReactiveParameter][]>(() =>
		ctx.parameters
			.entries()
			.filter(([key]) => coverage.ranges.has(key))
			.filter(([key]) => ctx.selected.has(key))
			.toArray()
	);
	type ResolvedDataRow = Omit<DataRow, 'composite' | 't'> & {
		composite: (Trajectory | Section | MultiPolygon)['axes']['composite']['values'][0];
		t?: CustomDate;
	};
	let data = $derived.by(async () => {
		const preloadAxis = [...new Set([fx, fy, x, y1])].filter((v) => !isUndefined(v));
		const rangeIds = parameters.map(([key]) => key);
		const rows = await coverage.query(coverage.indices, rangeIds, preloadAxis);
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
		}
		const data: Record<string, DataRow[]> = {};
		for (const [key, parameter] of parameters) {
			data[key] = rows.map((d) => {
				const row = { ...d };
				const value = row[key];
				parameters.forEach(([k]) => {
					if (key === k) return;
					delete row[k];
				});

				if (parameter.isCategorical) {
					row.category = parameter.getCategory(value as number)?.id || 'NULL';
				}

				return row;
			});
		}
		return data;
	});
	let context = $state<ChartState>();

	$effect(() => {
		const data: DataRow = context?.tooltip.data;
		if (!data) return;
		// console.log(data);
		const indices = new Map<string, number>();
		for (const [axisName, idx] of coverage.indices) {
			indices.set(axisName, (data[axisName + `$:{index}`] as number) || idx);
		}
		onIndicesChange?.(coverage, new Map(indices));
	});
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title><Badge variant="outline">{coverage.domainType}</Badge></Card.Title>
		<Card.Description class="flex flex-row gap-2">
			<div class="flex items-center space-x-2">
				<Switch id="facet-x" checked={xFacet} onCheckedChange={() => (xFacet = !xFacet)} />
				<Label for="facet-x">Facet X</Label>
			</div>
			<div class="flex items-center space-x-2">
				<Switch id="facet-y" checked={yFacet} onCheckedChange={() => (yFacet = !yFacet)} />
				<Label for="facet-y">Facet Y</Label>
			</div>
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#await data}
			<EmptyChart status="loading" />
		{:then data}
			<ChartGroup>
				<div class="grid items-center gap-2">
					{#each parameters as [key, parameter] (key)}
						{@const catic = parameter.isCategorical}
						<Chart.Container config={ctx.chartConfig}>
							<LineChart
								id={key}
								data={data[key]}
								x={(d) => {
									if (x === 'z') return d.z;
									if (x === 'composite') return new CustomDate(coverage.t[d.composite]);
									return new CustomDate(coverage.t[d.t]);
								}}
								{fx}
								{fy}
								y={key}
								grid
								bind:context
								facet={{
									// Also resolve values manually
									tooltip: (d: DataRow) => {}
								}}
								highlight={{ lines: true, points: true, facetAll: true }}
								padding={defaultChartPadding()}
								transform={{ mode: 'domain', axis: 'both' }}
								c={catic ? 'category' : undefined}
								cScale={catic ? scaleOrdinal() : undefined}
								cDomain={catic
									? [...parameter.categories.entries().map(([id]) => id), 'NULL']
									: undefined}
								cRange={catic
									? [
											...parameter.categories.values().map(({ color = parameter.color }) => color),
											parameter.color
										]
									: undefined}
								brush
								props={{ tooltip: { root: { facetAll: true } } }}
								onTooltipClick={(e, { data }) => console.log({ e, data })}
							>
								<!-- {#snippet tooltip({ context })}
									<Chart.Tooltip
										labelFormatter={(d, payload) => {
											return d instanceof CustomDate ? d.value : d;
										}}
										facetAll
									/>
								{/snippet} -->

								{#snippet marks({
									context: {
										height,
										padding: { top, bottom },
										yScale
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
												<Spline
													stroke={gradient}
													class={(d) =>
														isNull(d) ? 'stroke-2 [stroke-dasharray:4_4]' : 'stroke-2'}
												/>
												<Points fill={gradient} r={4} />
											{/snippet}
										</LinearGradient>
									{:else}
										<Spline stroke={parameter.color} />
										<Points fill={parameter.color} r={4} />
									{/if}
								{/snippet}
							</LineChart>
						</Chart.Container>
					{/each}
				</div>
			</ChartGroup>
		{:catch error}
			<EmptyChart status="error" {error} />
		{/await}
	</Card.Content>
</Card.Root>
