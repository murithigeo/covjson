import {
	type Dispatcher,
	type Evented,
	Map as MapInstance,
	GeoJSONSource,
	type MapGeoJSONFeature,
	type PromoteIdSpecification
} from 'maplibre-gl';
import { CoverageCollection, Exception, Range, Referencing, load } from '#lib/core/index.ts';
import type { BasicPluginOptions, CoverageJSONCoverageDiff, PluginOptions } from './types.js';
import type { Position } from 'coveragejson';
import { Coverage } from '#lib/core/coverage.ts';

export class MaplibrePlugin extends GeoJSONSource {
	_coveragecollection: CoverageCollection;
	covOptions: BasicPluginOptions;
	_referencing: Referencing;
	constructor(id: string, options: PluginOptions, dispatcher: Dispatcher, eventedParent: Evented) {
		super(
			id,
			{
				...options,
				data: { type: 'FeatureCollection', features: [] },
				type: 'geojson',
				promoteId: 
			},
			dispatcher,
			eventedParent
		);
		this.covOptions = options;
		this.covOptions.events = this.covOptions.events || {};
		this._coveragecollection = new CoverageCollection({
			type: 'CoverageCollection',
			coverages: []
		});
		Referencing.load({ crsId: 'OGC:CRS84' }).then((d) => (this._referencing = d));
	}

	onAdd(map: MapInstance): void {
		super.onAdd(map);
		for (const layerId in this.covOptions.events) {
			if (!this.map.getLayer(layerId)) continue;
			for (const event of this.covOptions.events[layerId]) {
				map.on(event, layerId, (e) => {
					const features = this.map.queryRenderedFeatures(e.point, {
						layers: [layerId]
					});
					const point = e.lngLat.wrap().toArray();
					//@ts-expect-error patching the event object
					e.coverages = this.getCoveragesFromFeatureList(features, point);
				});
			}
		}
	}
	getPromoteId(promoteId: PromoteIdSpecification) {
		if(!promoteId||typeof promoteId==="object")return "uuid"
		return promoteId;
	}
	getCoveragesFromFeatureList(features: MapGeoJSONFeature[], point: Position) {
		const idKey = this.getPromoteId(this.promoteId);
		const featureIds = features.map(({ properties }) => properties[idKey]);
		return this._coveragecollection.coverages.filter((cov) => {
			let value: string;
			
		})

		return features
			.map(({ properties }) => properties.uuid as string)
			.map((id) => this._coveragecollection.coverages.filter().get(id.toString()))
			.filter((v) => v !== undefined)
			.map((v) => v.calculateIndices(point)); // todo check if indices get calculated correctly
	}

	// todo reproject
	async loadCovData(data: PluginOptions['data']): Promise<Coverage | CoverageCollection> {
		let doc: Exclude<typeof data, string>;
		if (typeof data === 'string') {
			doc = await load<CoverageJSON.CoverageJSON>(data).then((doc) => {
				switch (doc.type) {
					case 'NdArray':
					case 'TiledNdArray':
						throw new Exception({
							url: data,
							status: 200,
							statusText: 'Expected Coverage/Domain/CoverageCollection but got NdArray'
						});
				}
				return doc;
			});
		}
		if (typeof data !== 'string') {
			// Fix type narrowing
			switch (data.type) {
				case 'CoverageCollection':
					return CoverageCollection.load(data);
				case 'Domain':
					data = new Coverage({ type: 'Coverage', domain: data, ranges: {} });
				case 'Coverage':
					if (data instanceof Coverage) return data;
					return await Coverage.load(data);
			}
		}
	}
	async setCovData(data: PluginOptions['data']) {
		let covjson = await this.loadCovData(data).then(async (data) => {
			if (!this.covOptions.reproject) return covjson;
			return await covjson.reproject();
		});
	}
	updateCovData(diff: CoverageJSONCoverageDiff): Promise<void> {
		return;
	}
}
