<script lang="ts">
	import { MapLibre, type Map } from 'svelte-maplibre';
	import { addSourceType, setWorkerUrl } from 'maplibre-gl';
	import { MaplibrePlugin } from '@murithigeo/covjson-maplibre';
	import { Coverage, type OnIndicesChange } from '@murithigeo/covjson-core';
	import TresDashboard from '#lib/dashboards/templates/tres.svelte';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import DataInput from '#lib/preview/input.svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { JsonView } from '@zerodevx/svelte-json-view';
	import covjsonData from '#lib/preview/data.js';
	import ModeWatcher from '#lib/mode-watcher.svelte';
	import { onMount } from 'svelte';
	import { setMode, systemPrefersMode } from 'mode-watcher';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	setWorkerUrl(workerUrl);
	// Add support https://www.npmjs.com/package/netcdfjs
	//@ts-expect-error incompatibility with inbuilt maplibre type
	addSourceType('coveragejson', MaplibrePlugin).catch(() => {});
	let data = $state<object>();
	let map = $state<Map>();
	let loaded = $state(false);
	let coverages = $state<Coverage[]>([]);
	let onIndicesChange = $state<OnIndicesChange>();
	onMount(async () => {
		setMode(systemPrefersMode.current || 'dark');
		const res = await fetch(covjsonData['Grid Tiled']);
		if (!res.ok) return;
		data = await res.json();
	});
	$effect(() => {
		if (!map || !data || !loaded) return;

		const source = 'cov-load-test';
		const layers = ['grid-outline', 'grid-layer', 'section'];
		if (!!map.getSource(source)) {
			// Or just implement an update/override method
			layers.forEach((id) => map!.removeLayer(id));
			map.removeSource(source);
		}
		map.addSource(source, {
			type: 'coveragejson',
			data,
			layers,
			listenTo: ['click'],
			tempLayerPaint: {
				fill: { 'fill-color': 'red' },
				symbol: { 'icon-color': 'red' }
			},
			onLoad: (data) => ({ coverages } = data)
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

		map.addLayer({
			source,
			id: 'section',
			type: 'symbol',
			layout: {
				'icon-image': 'bulldozer'
			}
		});
		map.on('click', 'section', (e) => {
			if (coverages) coverages = [];

			coverages = e.coverages;
		});
	});
</script>

<div class="h-screen">
	<div class="flex flex-row">
		<Sheet.Root>
			<Sheet.Trigger class={buttonVariants({ variant: 'outline' })}>Load Data</Sheet.Trigger>
			<Sheet.Content class="gap-2 "
				><Sheet.Header
					><Sheet.Title>Load CoverageJSON</Sheet.Title>
					<Sheet.Description>
						<ModeWatcher />
					</Sheet.Description></Sheet.Header
				>
				<div class="h-screen gap-2 overflow-auto">
					<Tabs.Root value="url" class="px-4">
						<Tabs.List>
							<Tabs.Trigger value="file">File</Tabs.Trigger>
							<Tabs.Trigger value="json">JSON</Tabs.Trigger>
							<Tabs.Trigger value="url">URL</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="file">
							<DataInput bind:data type="file" />
						</Tabs.Content>
						<Tabs.Content value="json">
							<DataInput bind:data type="text" />
						</Tabs.Content>
						<Tabs.Content value="url">
							<DataInput bind:data type="url" />
						</Tabs.Content>
					</Tabs.Root>
					<div class="px-4">
						<JsonView json={data} />
					</div>
				</div>
			</Sheet.Content>
		</Sheet.Root>
		<Label>! In Alpha</Label>
	</div>
	<TresDashboard bind:data={coverages} bind:onIndicesChange>
		<MapLibre
			class="h-full w-full"
			bind:map
			bind:loaded
			standardControls
			style="https://api.maptiler.com/maps/winter-v4/style.json?key=pj3BZkbRpSWczKG2Ml2w"
		/>
	</TresDashboard>
</div>
