<script lang="ts">
	import { Map, addSourceType } from 'maplibre-gl';
	import { MaplibrePlugin } from '#lib/plugin-maplibre/plugin.ts';
	import { getMapContext, addSource } from 'svelte-maplibre';
	import { dev } from '$app/env';
	import type { MaplibrePluginOptions } from '#lib/plugin-maplibre/index.ts';
	import { type Snippet } from 'svelte';
	import type { CoverageCollection } from '#lib/core/coverage-collection.ts';
	interface Props extends Omit<MaplibrePluginOptions, 'type'> {
		id: string;
		children?: Snippet<[{ data: CoverageCollection }]>;
	}

	let { data = $bindable(), id, children, ...props }: Props = $props();
	let { map, loaded } = $derived(getMapContext());

	//@ts-expect-error
	addSourceType('coveragejson', MaplibrePlugin)
		.then(() => (dev ? console.log('CoverageJSON Plugin Registered') : null))
		.catch((err) => (dev ? console.log(`CoverageJSON Plugin already registered`) : null));
	const setData = (data: MaplibrePluginOptions['data'], map: Map) => {
		if (!map) return;
	};
	$effect(() => {
		if (!map || !loaded) return;
		if (map.getSource(id)) {
			map?.addSource(id, { type: 'coveragejson', ...props });
		}
	});
</script>
