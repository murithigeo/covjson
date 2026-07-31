import maplibregl from 'maplibre-gl';
import {
	Coverage,
	CoverageCollection,
	type WithRequiredProperty,
	type OnIndicesChange
} from '@murithigeo/covjson-core';
import type { BasicPluginOptions, PluginOptions } from './types.d.ts';
import type { Position } from 'coveragejson';
import { loadCovJson } from './util.ts';
import type { Point, Polygon } from 'geojson';

export class MaplibrePlugin extends maplibregl.GeoJSONSource {
	_coverages: Map<string, Coverage>;
	covOptions: WithRequiredProperty<BasicPluginOptions, 'layers' | 'listenTo'>;
	// Implement functionality to remove geometries from temp layer if non-layer clicked
	indices: Record<string, number> | undefined;
	tempSourceId: string;
	constructor(
		id: string,
		options: PluginOptions,
		dispatcher: maplibregl.Dispatcher,
		eventedParent: maplibregl.Evented
	) {
		super(
			id,
			{
				...options,
				data: { type: 'FeatureCollection', features: [] },
				type: 'geojson'
			},
			dispatcher,
			eventedParent
		);
		this._coverages = new Map();
		this.covOptions = {
			...options,
			layers: options.layers || [],
			listenTo: options.listenTo || [],
			reproject: 'reproject' in options ? options.reproject : true
		};
		this.tempSourceId = `${this.id}::::scratchpad`;
		// const url = new URL('./worker.ts', import.meta.url).href;
		// this.workerSourceURL = url
		// maplibregl.importScriptInWorkers(url);
		this.indices = undefined;
		this.setCovData(options.data).then(() => this.covOptions.onLoad?.(this.covMapToCollection()));
	}

	async setCovData(v: PluginOptions['data']): Promise<void> {
		const load = loadCovJson(v).then((covs) => {
			const features: GeoJSON.Feature[] = [];
			for (const cov of covs) {
				this._coverages.set(cov.uuid, cov);
				features.push(cov.feature);
			}
			this.setData({ type: 'FeatureCollection', features });
		});
		await Promise.resolve(load);
		return this.covOptions.onLoad?.(this.covMapToCollection());
	}
	updateCovData() {}

	covMapToCollection(): CoverageCollection {
		const coll = new CoverageCollection({
			type: 'CoverageCollection',
			coverages: this._coverages.values().toArray()
		});
		return coll;
	}
	/**
	 * Add option to return the raw object
	 */
	getCovData = () => this.covMapToCollection();

	onAdd(map: maplibregl.Map): void {
		super.onAdd(map);
		const events = new Set(this.covOptions.listenTo);
		for (const event of events) {
			map.on(event, this.covOptions.layers, (e) => {
				// Doing so here ensures that layers are already loaded in
				const layers = new Set(
					this.covOptions.layers.filter((v) => map.getLayersOrder().includes(v))
				);
				const features = map.queryRenderedFeatures(e.point, {
					layers
				});
				const point = e.lngLat.wrap().toArray();
				const coverages = this.getCoveragesFromFeatureList(features, point);
				const [coverage] = coverages;
				if (coverage) this.onIndicesChange(coverage.uuid, coverage.indices);
				//@ts-expect-error we are patching the event object
				e.coverages = coverages;
			});
		}
	}
	getCoveragesFromFeatureList(features: maplibregl.MapGeoJSONFeature[], point: Position) {
		return features
			.map(({ properties }) => properties.uuid as string)
			.map((id) => this._coverages.get(id.toString()))
			.filter((v) => v !== undefined)
			.map((v) => v.calculateIndices(point));
	}

	onIndicesChange: OnIndicesChange = (uuid: string, indices: Record<string, number>) => {
		const geometry = this.indicesToGeometry(uuid, indices);
		this.indices = indices;
		if (!geometry) return;
		let mapSource = this.map.getSource<maplibregl.GeoJSONSource>(this.tempSourceId);
		if (!mapSource) {
			this.map.addSource(this.tempSourceId, {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});
			mapSource = this.map.getSource(this.tempSourceId);
		}

		const id = `${this.tempSourceId}:::temp-layer`;
		const ltype = geometry.type === 'Point' ? 'symbol' : 'fill';
		// Overwrite the data
		mapSource?.setData(geometry, true).then(() => {
			const layer = this.map.getLayer(id);
			if (layer && layer.type === ltype) return;
			if (layer) this.map.removeLayer(id);
			if (geometry.type === 'Point') {
				this.map.addLayer({
					id,
					source: this.tempSourceId,
					type: 'symbol',
					paint: this.covOptions.tempLayerPaint?.symbol,
					filter: ['==', ['geometry-type'], 'Point']
				});
				return;
			}
			this.map.addLayer({
				id,
				source: this.tempSourceId,
				type: 'fill',
				paint: this.covOptions.tempLayerPaint?.fill,
				filter: ['==', ['geometry-type'], 'Polygon']
			});
		});
	};
	indicesToGeometry(uuid: string, indices: Record<string, number>): Polygon | Point | undefined {
		const coverage = this._coverages.get(uuid);
		if (!coverage) return undefined;

		switch (coverage.domain.domainType) {
			case 'Grid':
				indices.x = indices.x || 0;
				indices.y = indices.y || 0;
				// Don't recompute
				if (this.indices?.x === indices.x && this.indices.y === indices.y) return;
				return coverage.domain.getPolygonAtIndices(indices.x, indices.y);
			case 'MultiPoint':
			case 'MultiPointSeries':
				indices.composite = indices.composite || 0;
				if (this.indices?.composite === indices.composite) return;
				return {
					type: 'Point',
					coordinates: coverage.domain.axes.composite.values[indices.composite]
				};
			case 'Trajectory':
			case 'Section':
				// todo Highlight the string and the nodes
				indices.composite = indices.composite || 0;
				if (this.indices?.composite === indices.composite) return;
				return {
					type: 'Point',
					// @ts-expect-error already extracted x,y via slice()
					coordinates: coverage.domain.axes.composite.values[indices.composite || 0]
				};
			case 'Point':
			case 'VerticalProfile':
			case 'PointSeries':
				if (indices) return;
				return coverage.domain.geometry;
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
			case 'Polygon':
			case 'PolygonSeries':
				indices.composite = indices.composite || 0;
				if (this.indices?.composite === indices.composite) return;
				return {
					type: 'Polygon',
					coordinates: coverage.domain.axes.composite.values[indices.composite || 0]
				};
			default:
				return; //throw error?
		}
	}
}
