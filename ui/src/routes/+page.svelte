<script lang="ts">
	import { MapLibre, type Map } from 'svelte-maplibre';
	import maplibregl from 'maplibre-gl';
	import { MaplibrePlugin } from '@murithigeo/covjson-maplibre';
	import { Coverage, CoverageCollection } from '@murithigeo/covjson-core';
	import Dashboard1 from '$lib/web-components/dashboards/dashboard-1.svelte';
	let data = $state<CoverageCollection>();
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
				listenTo: ['click'],
				tempLayerPaint: {
					fill: { 'fill-color': 'red' }
				},
				onLoad: (cov: any) => (data = cov)
			});

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
				//@ts-expect-error e is patched
				coverage = e.coverages[0];
			});
		});
	});
</script>

<Dashboard1
	bind:data={coverage}
	onIndicesChange={map?.getSource<MaplibrePlugin>?.('cov-load-test')?.onIndicesChange}
>
	<MapLibre
		class="h-full w-full"
		bind:map
		standardControls
		style="https://api.maptiler.com/maps/winter-v4/style.json?key=tTYdgg3LwO0um0Aqqs6u"
	/>
</Dashboard1>
