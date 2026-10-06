<script lang="ts">
	import { type MaplibrePluginOptions, MaplibrePlugin } from '#lib/core/index.ts-maplibre';
	import { GeoJSON } from 'svelte-maplibre';
	import { addSourceType } from 'maplibre-gl';

	let { data }: MaplibrePluginOptions = $props();
</script>

<GeoJSON data={{}}></GeoJSON>
