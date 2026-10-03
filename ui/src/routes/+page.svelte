<script lang="ts">
	import { MapLibre, type Map } from 'svelte-maplibre';
	import maplibregl from 'maplibre-gl';
	import { MaplibrePlugin } from '@murithigeo/covjson-maplibre';
	import { Coverage, type OnIndicesChange } from '@murithigeo/covjson-core';
	import TresDashboard from '$lib/dashboards/templates/tres.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import FileInput from '$lib/preview/input-file.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { JsonView } from '@zerodevx/svelte-json-view';
	const { addSourceType } = maplibregl;

	//@ts-expect-error incompatibility with inbuilt maplibre type
	addSourceType('coveragejson', MaplibrePlugin).catch(() => {});
	let data = $state<object>();
	//todo handle duplication of coverages on HMR
	let map = $state<Map>();
	let coverages = $state<Coverage[]>([]);
	let onIndicesChange = $state<OnIndicesChange>();
	$effect(() => {
		if (!map) return;
		if (!map.loaded) return;
		map?.on('load', ({ target: map }) => {
			if (!data) return;
			const source = 'cov-load-test';
			map.addSource(source, {
				type: 'coveragejson',
				data,
				layers: ['grid-outline', 'grid-layer', 'section'],
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
	});
	// Add toaster for errors
	const loadFromUrl = (href: string) =>
		fetch(href)
			.then((res) => {
				if (!res.ok) throw Error(`Error loading from ${href}. Status:${res.status}`);
				return res;
			})
			.then((res) => res.json())
			.catch((error) => console.error(error));

	let invalid = $state(false);
</script>

<Sheet.Root>
	<Sheet.Trigger class={buttonVariants({ variant: 'outline' })}>Load Data</Sheet.Trigger>
	<Sheet.Content
		><Sheet.Header></Sheet.Header>
		<JsonView json={data} />
		<Tabs.Root value="json">
			<Tabs.List>
				<Tabs.Trigger value="file">File</Tabs.Trigger>
				<Tabs.Trigger value="json">JSON</Tabs.Trigger>
				<Tabs.Trigger value="url">URL</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="file">
				<FileInput bind:data />
			</Tabs.Content>
			<Tabs.Content value="json">
				<Field.Field data-invalid={invalid}>
					<Input type="text" aria-invalid={invalid} />
				</Field.Field>
			</Tabs.Content>
			<Tabs.Content value="url">
				<Field.Field>
					<Input type="url" />
				</Field.Field>
			</Tabs.Content>
		</Tabs.Root>
	</Sheet.Content>
</Sheet.Root>
<TresDashboard bind:data={coverages} bind:onIndicesChange>
	<MapLibre
		class="h-full w-full"
		bind:map
		standardControls
		style="https://api.maptiler.com/maps/winter-v4/style.json?key=tTYdgg3LwO0um0Aqqs6u"
	/>
</TresDashboard>
