<script lang="ts">
	import { center } from '@turf/center';
	import { type Map } from 'svelte-maplibre';
	import { Coverage, type DataRow } from '#lib/core/index.ts';
	import TresDashboard from '#lib/ui/dashboards/templates/tres.svelte';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import DataInput from '#lib/ui/preview/input.svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { JsonView } from '@zerodevx/svelte-json-view';
	import covjsonData from '#lib/ui/preview/data.js';
	import ModeWatcher from '#lib/mode-watcher.svelte';
	import { onMount } from 'svelte';
	import { setMode, systemPrefersMode } from 'mode-watcher';
	import type { Position } from 'geojson';
	import Maplibre from '#lib/ui/preview/maplibre.svelte';

	// Add support https://www.npmjs.com/package/netcdfjs
	let data = $state<object>();
	let map = $state<Map>();
	let loaded = $state<string>();
	let coverages = $state<Coverage[]>([]);

	onMount(() => {
		setMode(systemPrefersMode.current || 'dark');
		fetch(covjsonData['MultiPolygon']).then((res) => {
			if (!res.ok) return;
			res.json().then((d) => (data = d));
		});
	});

	$effect(() => {
		if (!map || !data || !loaded) return;

		const source = 'cov-load-test';
		const layers = ['grid-outline', 'grid-layer', 'section'];
		if (map.getSource(source)) {
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

	let onIndicesChange = $derived(
		(coverage: Coverage | ReturnType<Coverage['denormalize']>, data: DataRow | null) => {
			// close popup if data is null
			const indices = Object.fromEntries(
				coverage.axesSize
					.entries()
					.toArray()
					.map(([axisName]): [string, number] => [axisName, data[axisName] as number])
			);

			// Figure how to render popup
			let lngLat: Position;
			switch (coverage.domain.domainType) {
				case 'VerticalProfile':
				case 'Point':
				case 'PointSeries':
					lngLat = coverage.domain.geometry.coordinates;
					break;
				case 'MultiPoint':
				case 'MultiPointSeries':
				case 'Section':
				case 'Trajectory':
					lngLat = coverage.domain.geometry.coordinates[indices.composite];
					break;
				default:
					({
						geometry: { coordinates: lngLat }
					} = center(
						coverage.domain.domainType === 'Grid'
							? coverage.domain.getPolygonAtIndices(indices.x, indices.y)
							: coverage.domain.geometry
					));
			}
		}
	);
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
		<Maplibre bind:map bind:loaded />
	</TresDashboard>
</div>
