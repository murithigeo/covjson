<script lang="ts">
	import CoveragePreview from '$lib/charts/index.svelte';
	import { MapLibre, type Map } from 'svelte-maplibre';
	import maplibregl from 'maplibre-gl';
	import { MaplibrePlugin } from '@murithigeo/covjson-maplibre';
	import { Coverage, CoverageCollection } from '@murithigeo/covjson-core';
	import '$lib/web-components/parameter.js';
	let data = $state<CoverageCollection>();
	const { addSourceType } = maplibregl;
	// @ts-expect-error By def, maplibre only accepts objects matching inbuilt specifs
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
				onLoad: (cov: unknown) => (data = cov)
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
	$inspect(data?.parameters);
</script>

<div class="space-2 grid-cols-2 sm:flex sm:flex-col md:grid">
	<MapLibre
		class="h-screen w-full"
		style="https://api.maptiler.com/maps/winter-v4/style.json?key=tTYdgg3LwO0um0Aqqs6u"
		standardControls
		bind:map
	></MapLibre>
	<!-- <div class="align-items-center h-screen flex-col">
		<CoveragePreview
			bind:coverage
			pageWith="t"
			chartConfig={{
				FOO: { color: 'red' }
			}}
			onIndicesChange={map?.getSource<MaplibrePlugin>('cov-load-test')?.onIndicesChange}
		/>
	</div> -->
	{#if data}
		<covjson-parameter data={data.parameters.get('FOO')}></covjson-parameter>
	{/if}
</div>
