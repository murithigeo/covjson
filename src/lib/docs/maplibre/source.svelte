<script lang="ts">
	import { Map, addSourceType } from 'maplibre-gl';
	import { MaplibrePlugin } from '#lib/plugin-maplibre/plugin.ts';
	import { getMapContext } from 'svelte-maplibre';
	import { dev } from '$app/env';
	import type { MaplibrePluginOptions } from '#lib/plugin-maplibre/index.ts';
	import { type Snippet } from 'svelte';
	interface Props extends Omit<MaplibrePluginOptions, 'type'> {
		id: string;
		children?: Snippet<[{ source?: MaplibrePlugin }]>;
	}

	let { data = $bindable(), id, children, ...props }: Props = $props();
	let { map, loaded } = $derived(getMapContext());

	//@ts-expect-error
	addSourceType('coveragejson', MaplibrePlugin)
		.then(() => (dev ? console.log('CoverageJSON Plugin Registered') : null))
		.catch((err) => (dev ? console.log(`CoverageJSON Plugin already registered`) : null));

	let source = $state<MaplibrePlugin>();
	$effect(() => {
		if (!map || !loaded) return;
		source = map.getSource<MaplibrePlugin>(id);
		if (source) return;
		map?.addSource(id, { type: 'coveragejson', ...props });
		source = map.getSource(id);
	});

	/// Add logic for updated data
</script>

{@render children?.({ source })}
