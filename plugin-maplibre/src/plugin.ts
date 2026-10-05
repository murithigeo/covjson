import {
	type Dispatcher,
	type Evented,
	Map as MapInstance,
	GeoJSONSource,
	type MapGeoJSONFeature
} from 'maplibre-gl';
import {
	Coverage,
	CoverageCollection,
	type OnIndicesChange,
	type WithRequiredProperty
} from '@murithigeo/covjson-core';
import type { BasicPluginOptions, PluginOptions } from './types.js';
import type { Position } from 'coveragejson';
import { loadCovJson } from './util.ts';
import type { Point, Polygon } from 'geojson';

//todo add hmr discerner. If URL already exists and tries to load again, invalid existing data
export class MaplibrePlugin extends GeoJSONSource {
	_coverages: Map<string, Coverage>;
	covOptions: WithRequiredProperty<BasicPluginOptions, 'layers' | 'listenTo'>;
	tempSourceId: string;
	constructor(id: string, options: PluginOptions, dispatcher: Dispatcher, eventedParent: Evented) {
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
		return load.then(() => this.covOptions.onLoad?.(this.covMapToCollection()));
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

	onAdd(map: MapInstance): void {
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
	getCoveragesFromFeatureList(features: MapGeoJSONFeature[], point: Position) {
		return features
			.map(({ properties }) => properties.uuid as string)
			.map((id) => this._coverages.get(id.toString()))
			.filter((v) => v !== undefined)
			.map((v) => v.calculateIndices(point)); // todo check if indices get calculated correctly
	}

	onIndicesChange(coverage: Coverage | string | undefined, indices: Map<string, number>) {
		if (typeof coverage === 'string') {
			coverage = this._coverages.get(coverage);
		}
		if (!coverage) return;
		const geometry = this.indicesToGeometry(coverage, indices || coverage.indices);

		if (!geometry) return;

		if (!this.map.isStyleLoaded()) return;
		let mapSource = this.map.getSource<GeoJSONSource>?.(this.tempSourceId);
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
		mapSource?.setData(geometry).then(() => {
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
	}
	indicesToGeometry(coverage: Coverage, indices: Map<string, number>): Polygon | Point | undefined {
		switch (coverage.domain.domainType) {
			case 'Grid':
				return coverage.domain.getPolygonAtIndices(indices.get('x') || 0, indices.get('y') || 0);
			case 'MultiPoint':
			case 'MultiPointSeries':
				return {
					type: 'Point',
					coordinates: coverage.domain.axes.composite.values[indices.get('composite')!]
				};
			case 'Trajectory':
			case 'Section':
				return {
					type: 'Point',
					coordinates: coverage.domain.axes.composite.values[indices.get('composite')!].slice(
						1
					) as Position
				};
			case 'Point':
			case 'VerticalProfile':
			case 'PointSeries':
				return coverage.domain.geometry;
			case 'MultiPolygon':
			case 'MultiPolygonSeries':
			case 'Polygon':
			case 'PolygonSeries':
				return {
					type: 'Polygon',
					coordinates: coverage.domain.axes.composite.values[indices.get('composite') || 0]
				};
			default:
				return; //throw error?
		}
	}

	updateCoverageData() {}
}
