import maplibregl from 'maplibre-gl';
import { Coverage, CoverageCollection } from '@murithigeo/covjson-core';
import type { PluginOptions } from './types.d.ts';
import type { Position } from '../../core/src/coveragejson.d.ts';
import { loadCovJson } from './util.ts';
export class MaplibrePlugin extends maplibregl.GeoJSONSource {
	// layerIds: string[]; // The list of layerIds derived from this source
	_coverages: Map<string, Coverage>;
	// listenTo: (keyof maplibregl.MapLayerEventType)[];
	covOptions: Required<Pick<PluginOptions, 'data' | 'layers' | 'listenTo' | 'reproject'>>;
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
			reproject: true
		};
		// const url = new URL('./worker.ts', import.meta.url).href;
		// this.workerSourceURL = url
		// maplibregl.importScriptInWorkers(url);
		this.setCovData(options.data, false);
	}

	setCovData(v: PluginOptions['data'], waitForCompletion?: false): this;
	setCovData(v: PluginOptions['data'], waitForCompletion?: true): Promise<void>;
	setCovData(v: PluginOptions['data'], waitForCompletion?: boolean) {
		const load = loadCovJson(v).then((covs) => {
			const features: GeoJSON.Feature[] = [];
			for (const cov of covs) {
				this._coverages.set(cov.uuid, cov);
				features.push(cov.feature);
			}
			console.log({ features });
			this.setData({ type: 'FeatureCollection', features });
		});
		if (waitForCompletion) return Promise.resolve(load);
		return this;
	}
	updateCovData() {}
	/**
	 * Add option to return the raw object
	 */
	getCovData(): CoverageCollection {
		const coll = new CoverageCollection({
			type: 'CoverageCollection',
			coverages: []
		});
		this._coverages.values().forEach((cov) => coll.coverages.push(cov));
		return coll;
	}

	onAdd(map: maplibregl.Map): void {
		super.onAdd(map);
		const events = new Set(this.covOptions.listenTo);
		for (const event of events) {
			map.on(event, this.covOptions.layers || [], (e) => {
				// Doing so here ensures that layers are already loaded in
				const layers = new Set(
					this.covOptions.layers.filter((v) => map.getLayersOrder().includes(v))
				);
				const features = map.queryRenderedFeatures(e.point, {
					layers
				});
				//@ts-expect-error we are patching the event object before it is used in other listeners
				e.coverages = this.getCoveragesFromFeatureList(features!, [e.point.x, e.point.y]);
			});
		}
	}
	getCoveragesFromFeatureList(features: maplibregl.MapGeoJSONFeature[], point: Position) {
		return features
			.map(({ properties }) => properties.id as string)
			.filter((v) => v !== undefined)
			.map((id) => this._coverages.get(id.toString()))
			.filter((v) => v !== undefined)
			.map((v) => v.calculateIndices(point));
	}
}
