<script lang="ts">
	import { addSourceType } from 'maplibre-gl';
	import { MaplibrePlugin } from '#lib/plugin-maplibre/plugin.ts';
	import { getMapContext } from 'svelte-maplibre';
	import { dev } from '$app/env';
	import type { MaplibrePluginOptions } from '#lib/plugin-maplibre/index.ts';
	import { type Snippet } from 'svelte';
	interface Props extends Omit<MaplibrePluginOptions, 'type'> {
		id: string;
		children?: Snippet<[{ source: MaplibrePlugin }]>;
	}

	let { id, data = $bindable(), children, ...props }: Props = $props();
	let { map, loaded } = $derived(getMapContext());

	//@ts-expect-error SourceClass conflict
	addSourceType('coveragejson', MaplibrePlugin)
		.then(() => (dev ? console.log('CoverageJSON Plugin Registered') : null))
		.catch(() => (dev ? console.log(`CoverageJSON Plugin already registered`) : null));

	let source = $state<MaplibrePlugin>();

	$effect(() => {
		if (!map || !loaded) return;
		source = map.getSource<MaplibrePlugin>(id);
		if (source) {
			source.setCovData(data);
			return;
		}
		map.on('load', () => {
			map?.addSource(id, {
				type: 'coveragejson',
				data,
				...props
			});

			source = map.getSource(id);
		});
	});
</script>

{#if source}
	{@render children?.({ source })}
{/if}
