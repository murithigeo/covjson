<script lang="ts">
	import type { Coverage } from '#lib/core/index.ts';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import DataInput from '#lib/ui/preview/input.svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { JsonView } from '@zerodevx/svelte-json-view';
	import ModeWatcher from '#lib/mode-watcher.svelte';
	import Maplibre from '#lib/ui/preview/maplibre.svelte';
	import CovJsonSource from '#lib/docs/maplibre/source.svelte';
	import { SymbolLayer, LineLayer, FillLayer, type LayerClickInfo } from 'svelte-maplibre';
	import type { MaplibrePlugin, MaplibrePluginOptions } from '#lib/plugin-maplibre/index.ts';
	import type { Colors } from '#lib/ui/coverage/types.d.ts';
	import CoverageCpt from '#lib/ui/coverage/coverage-cpt.svelte';
	import { makeCoverageIndicesReactive } from '#lib/ui/coverage/ctx.svelte.ts';

	let data = $state<MaplibrePluginOptions['data']>('/sample-data/grid-multi-z-t.covjson');
	let coverages = $state<Coverage[]>([]);

	const handleLayerEvent = (e: LayerClickInfo, source: MaplibrePlugin) => {
		const covs = source.getCoveragesFromFeatureList(e.features, e.event.lngLat);
		updateCoverages(covs);
		return {
			...e,
			coverages: covs
		};
	};

	// Source - https://stackoverflow.com/a/1484514
	// Posted by Anatoliy, modified by community. See post 'Timeline' for change history
	// Retrieved 2026-08-20, License - CC BY-SA 3.0

	function getRandomColor() {
		const letters = '0123456789ABCDEF';
		let color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	function updateCoverages(covs: Coverage[], replaceAll?: boolean) {
		if (replaceAll) coverages = covs.map((cov) => makeCoverageIndicesReactive(cov));
		else {
			for (const cov of covs) {
				let idx = coverages.findIndex((c) => cov.uuid === c.uuid);
				if (idx >= 0) {
					cov.indices.forEach((v, k) => coverages[idx].indices.set(k, v));
				} else coverages.push(cov);
			}
		}
		for (const k of covs.flatMap((c) => [...c.ranges.keys(), ...c._ranges.keys()])) {
			if (colors[k]) continue;
			colors[k] = { default: getRandomColor() };
		}
	}
	let colors = $state<Colors>({});
</script>

<div class="h-screen w-full md:grid md:grid-cols-2">
	<div class="h-75 md:h-full">
		<Maplibre>
			{@const source = 'sample-data'}
			<CovJsonSource
				bind:data
				onData={(data) => {
					updateCoverages(data.coverages, true);
				}}
				id="sample-data"
				buffer={10}
			>
				{#snippet children({ source: plugin })}
					<FillLayer
						{source}
						filter={[
							'in',
							['get', 'domainType'],
							[
								'literal',
								['Grid', 'MultiPolygon', 'MultiPolygonSeries', 'PolygonSeries', 'Polygon']
							]
						]}
						paint={{ 'fill-color': 'grey', 'fill-opacity': 0.5 }}
						onclick={(e) => handleLayerEvent(e, plugin)}
					></FillLayer>
					<!-- Draw lines between Grid cells and Trajectory-based nodes -->
					<LineLayer
						{source}
						filter={['in', ['get', 'domainType'], ['literal', ['Grid', 'Section', 'Trajectory']]]}
						paint={{ 'line-color': 'red', 'line-width': 0.4 }}
					></LineLayer>
					<SymbolLayer
						id="point-based-coverages"
						// Pass explicit source coz Custom Source
						{source}
						layout={{ 'icon-image': 'bulldozer' }}
						filter={[
							'in',
							['get', 'domainType'],
							[
								'literal',
								[
									'Point',
									'PointSeries',
									'VerticalProfile',
									'Section',
									'Trajectory',
									'MultiPoint',
									'MultiPointSeries'
								]
							]
						]}
						onclick={(e) => handleLayerEvent(e, plugin)}
					></SymbolLayer>
				{/snippet}
			</CovJsonSource>
		</Maplibre>
	</div>

	<div class="space-y-2 overflow-y-auto">
		<Sheet.Root>
			<Sheet.Trigger class={buttonVariants({ variant: 'outline' })}>Load Data</Sheet.Trigger>
			<Sheet.Content class="gap-2 "
				><Sheet.Header
					><Sheet.Title>Load CoverageJSON</Sheet.Title>
					<Sheet.Description>
						<ModeWatcher />
					</Sheet.Description></Sheet.Header
				>
				<div class="h-screen gap-2 overflow-auto">
					<Tabs.Root value="url" class="px-4">
						<Tabs.List>
							<Tabs.Trigger value="file">File</Tabs.Trigger>
							<Tabs.Trigger value="json">JSON</Tabs.Trigger>
							<Tabs.Trigger value="url">URL</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="file">
							<DataInput bind:data type="file" />
						</Tabs.Content>
						<Tabs.Content value="json">
							<DataInput bind:data type="text" />
						</Tabs.Content>
						<Tabs.Content value="url">
							<DataInput bind:data type="url" />
						</Tabs.Content>
					</Tabs.Root>
					<div class="px-4">
						<JsonView json={data} />
					</div>
				</div>
			</Sheet.Content>
		</Sheet.Root>
		{#each coverages as coverage (coverage.uuid)}
			<CoverageCpt {coverage} {colors} />
		{/each}
	</div>
</div>
