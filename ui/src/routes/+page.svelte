<script lang="ts">
	import CoveragePreview from '$lib/charts/index.svelte';
	import { MapLibre, type Map } from 'svelte-maplibre';
	import maplibregl from 'maplibre-gl';
	import { MaplibrePlugin } from '@murithigeo/covjson-maplibre';
	import { Coverage } from '@murithigeo/covjson-core';

	const { addSourceType } = maplibregl;
	addSourceType('coveragejson', MaplibrePlugin).catch(() => {});

	let map = $state<Map>();
	let coverage = $state<Coverage>();
	$effect(() => {
		map?.on('load', () => {
			map?.addSource('cov-load-test', {
				type: 'coveragejson',
				data: 'https://covjson.org/playground/coverages/grid-tiled.covjson',
				layers: ['grid-outline', 'grid-layer', 'random'],
				listenTo: ['click']
			});
			// map?.addLayer({
			// 	source: 'cov-load-test',
			// 	id: 'test-load-layer',
			// 	type: 'symbol',
			// 	layout: {
			// 		'icon-image': 'bulldozer'
			// 	}
			// });

			map?.addLayer({
				source: 'cov-load-test',
				id: 'grid-layer',
				type: 'fill',
				paint: { 'fill-color': 'grey', 'fill-opacity': 0.5 }
			});
			map?.addLayer({
				source: 'cov-load-test',
				id: 'grid-outline',
				type: 'line',
				paint: { 'line-color': 'red', 'line-width': 0.4 }
			});
			map?.on('click', 'grid-layer', (e) => {
				if (coverage) coverage = undefined;
				coverage = e.coverages[0];
				// console.log(e.coverages[0].indices,"checj")
			});
			// console.log(map?.getSource<MaplibrePlugin>("cov-load-test"))
			// map
			// 	?.getSource<MaplibrePlugin>('cov-load-test')
			// 	?.setCovData('https://covjson.org/playground/coverages/profile-collection.covjson');
		});
	});
</script>

<div class="space-2 grid grid-cols-2">
	<MapLibre
		class="h-full h-screen w-full"
		style="https://api.maptiler.com/maps/winter-v4/style.json?key=tTYdgg3LwO0um0Aqqs6u"
		standardControls
		bind:map
	></MapLibre>
	<CoveragePreview
		bind:coverage
		paginateBy="t"
		chartConfig={{
			FOO: { color: 'red' }
		}}
	/>
</div>
