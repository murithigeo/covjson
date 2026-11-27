<script lang="ts">
	import { addSourceType, setWorkerUrl } from 'maplibre-gl';
	import type { ComponentProps } from 'svelte';
	import { MapLibre } from 'svelte-maplibre';
	import { MaplibrePlugin } from '#lib/plugin-maplibre/index.js';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	setWorkerUrl(workerUrl);

	interface Props {
		children?: ComponentProps<typeof MapLibre>['children'];
	}
	let { children: children_ }: Props = $props();

	//@ts-expect-error plugin doesnt conform to Source
	addSourceType('coveragejson', MaplibrePlugin).catch(() => {});
</script>

<MapLibre
	class="h-full w-full"
	standardControls
	style="https://api.maptiler.com/maps/winter-v4/style.json?key=pj3BZkbRpSWczKG2Ml2w"
	>{#snippet children({ ...props })}
		{@render children_?.(props)}
	{/snippet}</MapLibre
>
