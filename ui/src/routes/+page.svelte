<script lang="ts">
	import { MapLibre, type Map } from 'svelte-maplibre';
	import maplibregl from 'maplibre-gl';
	import { MaplibrePlugin } from '@murithigeo/covjson-maplibre';
	import { Coverage, type OnIndicesChange } from '@murithigeo/covjson-core';
	import TresDashboard from '$lib/dashboards/templates/tres.svelte';
	const { addSourceType } = maplibregl;
	//@ts-expect-error incompatibility with inbuilt maplibre type
	addSourceType('coveragejson', MaplibrePlugin).catch(() => {});

	//todo handle duplication of coverages on HMR
	let map = $state<Map>();
	let coverages = $state<Coverage[]>();
	let onIndicesChange = $state<OnIndicesChange>();
	$effect(() => {
		map?.on('load', ({ target: map }) => {
			const source = 'cov-load-test';
			map.addSource(source, {
				type: 'coveragejson',
				data: window.location.href + 'grid-multi-z-t.covjson',
				// data: 'https://covjson.org/playground/coverages/grid-tiled.covjson',
				// data: 'https://covjson.org/playground/coverages/grid-categorical.covjson',
				layers: ['grid-outline', 'grid-layer', 'section'],
				listenTo: ['click'],
				tempLayerPaint: {
					fill: { 'fill-color': 'red' },
					symbol: { 'icon-color': 'red' }
				},
				onLoad: (data) => {
					({ coverages } = data);
				}
			});
			onIndicesChange = map.getSource<MaplibrePlugin>(source)?.onIndicesChange;
			map.addLayer({
				source,
				id: 'grid-layer',
				type: 'fill',
				paint: { 'fill-color': 'grey', 'fill-opacity': 0.5 }
			});
			map.addLayer({
				source,
				id: 'grid-outline',
				type: 'line',
				paint: { 'line-color': 'red', 'line-width': 0.4 }
			});
			// map.addLayer({
			// 	source,
			// 	id: 'profile',
			// 	type: 'symbol',
			// 	layout: { 'icon-image': 'bulldozer' }
			// });
			map.addLayer({
				source,
				id: 'section',
				type: 'symbol',
				layout: {
					'icon-image': 'bulldozer'
				}
			});
			map.on('click', 'section', (e) => {
				// console.log(e.coverages);
				if (coverages) coverages = [];
				coverages = e.coverages;
			});
		});
	});
</script>

<TresDashboard bind:data={coverages} {onIndicesChange}>
	<MapLibre
		class="h-full w-full"
		bind:map
		standardControls
		style="https://api.maptiler.com/maps/winter-v4/style.json?key=tTYdgg3LwO0um0Aqqs6u"
	/>
</TresDashboard>
