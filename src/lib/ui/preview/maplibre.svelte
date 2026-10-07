<script lang="ts">
	import { addSourceType, setWorkerUrl, type Map } from 'maplibre-gl';
	import type { ComponentProps, Snippet } from 'svelte';
	import { MapLibre } from 'svelte-maplibre';
	import { MaplibrePlugin } from '#lib/plugin-maplibre/plugin.ts';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	setWorkerUrl(workerUrl);

	interface Props {
		map?: Map;
		children?: ComponentProps<typeof MapLibre>['children'];
		loaded?: boolean;
	}
	let { map = $bindable(), loaded = $bindable(), children }: Props = $props();

	//@ts-expect-error plugin doesnt conform to Source
	addSourceType('coveragejson', MaplibrePlugin).catch(() => {});
</script>

<MapLibre
	class="h-full w-full"
	bind:map
	bind:loaded
	standardControls
	style="https://api.maptiler.com/maps/winter-v4/style.json?key=pj3BZkbRpSWczKG2Ml2w"
	>{#snippet children({ ...props })}
		{@render children?.(props)}
	{/snippet}</MapLibre
>
