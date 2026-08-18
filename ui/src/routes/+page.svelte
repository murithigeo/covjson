<script lang="ts">
	import { MapLibre, type Map } from 'svelte-maplibre';
	import maplibregl from 'maplibre-gl';
	import { MaplibrePlugin } from '@murithigeo/covjson-maplibre';
	import { Coverage, CoverageCollection, type OnIndicesChange } from '@murithigeo/covjson-core';
	import Dashboard1 from '$lib/web-components/dashboards/dashboard-1.svelte';
	let data = $state<CoverageCollection>();
	const { addSourceType } = maplibregl;
	//@ts-expect-error incompatibility with inbuilt maplibre type
	addSourceType('coveragejson', MaplibrePlugin).catch(() => {});

	let map = $state<Map>();
	let coverage = $state<Coverage>();
	let onIndicesChange = $state<OnIndicesChange>();
	$effect(() => {
		map?.on('load', ({ target: map }) => {
			const source = 'cov-load-test';
			map.addSource(source, {
				type: 'coveragejson',
				data: window.location.href + 'section-sample.covjson',
				layers: ['grid-outline', 'grid-layer', 'section'],
				listenTo: ['click'],
				tempLayerPaint: {
					fill: { 'fill-color': 'red' },
					symbol: { 'icon-color': 'red' }
				},
				onLoad: (cov: any) => (data = cov)
			});
			onIndicesChange = map.getSource<MaplibrePlugin>(source)?.onIndicesChange;
			// map.addLayer({
			// 	source,
			// 	id: 'grid-layer',
			// 	type: 'fill',
			// 	paint: { 'fill-color': 'grey', 'fill-opacity': 0.5 }
			// });
			// map.addLayer({
			// 	source,
			// 	id: 'grid-outline',
			// 	type: 'line',
			// 	paint: { 'line-color': 'red', 'line-width': 0.4 }
			// });
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
				if (coverage) coverage = undefined;
				//@ts-expect-error e is patched
				coverage = e.coverages[0];
			});
		});
	});
</script>

<Dashboard1 bind:data={coverage} bind:coveragecollection={data} {onIndicesChange}>
	<MapLibre
		class="h-full w-full"
		bind:map
		standardControls
		style="https://api.maptiler.com/maps/winter-v4/style.json?key=tTYdgg3LwO0um0Aqqs6u"
	/>
</Dashboard1>
