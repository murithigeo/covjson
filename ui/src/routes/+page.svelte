<script lang="ts">
import Grid from "$lib/charts/grid.svelte";
	// import { MapLibre, type Map } from 'svelte-maplibre';
	// import maplibregl from 'maplibre-gl';
	// import { MaplibrePlugin } from '$lib/core/plugin-maplibre/index.js';

	// const { addSourceType } = maplibregl;
	// addSourceType('coveragejson', MaplibrePlugin).catch(() => {});

	// let map = $state<Map>();

	// $effect(() => {
	// 	map?.on('load', () => {
	// 		map?.addSource('cov-load-test', {
	// 			type: 'coveragejson',
	// 			data: 'https://covjson.org/playground/coverages/grid-domain-bng.covjson',
	// 			layerIds: ['test-load-layer', 'grid-layer']
	// 		});
	// 		map?.addLayer({
	// 			source: 'cov-load-test',
	// 			id: 'test-load-layer',
	// 			type: 'symbol',
	// 			layout: {
	// 				'icon-image': 'bulldozer'
	// 			}
	// 		});
	// 		map?.addLayer({
	// 			source: 'cov-load-test',
	// 			id: 'grid-layer',
	// 			type: 'fill',
	// 			paint: { 'fill-color': 'grey', 'fill-opacity': 0.5 }
	// 		});
	// 		map?.addLayer({
	// 			source: 'cov-load-test',
	// 			id: 'grid-outline',
	// 			type: 'line',
	// 			paint: { 'line-color': 'red', 'line-width': 0.4 }
	// 		});
	// 		map
	// 			?.getSource<MaplibrePlugin>('cov-load-test')
	// 			?.setCovData('https://covjson.org/playground/coverages/profile-collection.covjson');
	// 	});
	// });
</script>

<Grid/>
<!-- 
<MapLibre
	class="h-full h-screen w-full"
	style="https://api.maptiler.com/maps/winter-v4/style.json?key=tTYdgg3LwO0um0Aqqs6u"
	standardControls
	bind:map
>
</MapLibre> -->
<!-- 
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">

	{#await doc then coveragejson}
	<div class="flex-1 min-w-0 h-full">
		<MapLibre
		class="w-full h-full h-screen"
			style="https://api.maptiler.com/maps/winter-v4/style.json?key=tTYdgg3LwO0um0Aqqs6u"
			standardControls
		>
			<MapLibreGeoJSONSource {coveragejson} id="some-data">
				{#snippet children({ coverages })}
					<MapLibreSymbolLayer
						{coverages}
						onclick={(e) => {
							console.log(e);
							coverage = e.coverages[0];
						}}
						layout={{ 'icon-image': 'bulldozer' }}
						filter={['in', ['get', 'domainType'], ['literal', ['MultiPoint', 'MultiPointSeries']]]}
					/>

					<MapLibreFillLayer
						{coverages}
						onclick={(e) => {
							console.log(e.map.getSource('some-data'));
							coverage = e.coverages[0];
						}}
						filter={[
							'in',
							['get', 'domainType'],
							['literal', ['MultiPolygon', 'Grid', 'MultiPolygonSeries']]
						]}
						paint={{ 'fill-outline-color': 'red' }}
					/>
				{/snippet}
			</MapLibreGeoJSONSource>
		</MapLibre>
	</div>
	<div class="h-screen overflow-auto">
		<SideView
			bind:coverage
			bind:activeParameters
			parameters={coveragejson.parameters}
			parameterGroups={coveragejson.parameterGroups}
		/>
		</div>
	{/await}
</div> -->
