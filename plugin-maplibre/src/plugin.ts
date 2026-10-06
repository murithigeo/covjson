import {
	type Dispatcher,
	type Evented,
	Map as MapInstance,
	GeoJSONSource,
	type MapGeoJSONFeature,
	Popup
} from 'maplibre-gl';
import { Coverage, CoverageCollection, type WithRequiredProperty } from '@murithigeo/covjson-core';
import type { BasicPluginOptions, PluginOptions } from './types.js';
import type { Position } from 'coveragejson';
import { loadCovJson } from './util.ts';
import type { Point, Polygon } from 'geojson';

//todo add hmr discerner. If URL already exists and tries to load again, invalid existing data
export class MaplibrePlugin extends GeoJSONSource {
	_coverages: Map<string, Coverage>;
	covOptions: WithRequiredProperty<BasicPluginOptions, 'layers' | 'listenTo'>;
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

	updateCoverageData() {}
}
