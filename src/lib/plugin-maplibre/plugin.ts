import {
	type Dispatcher,
	type Evented,
	Map as MapInstance,
	GeoJSONSource,
	type MapGeoJSONFeature,
	type PromoteIdSpecification
} from 'maplibre-gl';
import {
	CoverageCollection,
	Exception,
	Range,
	Referencing,
	isNdArray,
	load
} from '#lib/core/index.js';
import type { BasicPluginOptions, PluginOptions } from './types.js';
import type { Domain, Parameter, Position } from 'coveragejson';

export class MaplibrePlugin extends GeoJSONSource {
	_coveragecollection: CoverageCollection;
	covOptions: BasicPluginOptions;
	_referencing?: Referencing;
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
		if (!promoteId || typeof promoteId === 'object') return 'uuid';
		return promoteId;
	}
	getCoveragesFromFeatureList(features: MapGeoJSONFeature[], point: Position) {
		const idKey = this.getPromoteId(this.promoteId);
		const featureIds = features.map(({ properties }) => properties.uuid);
		return this._coveragecollection.coverages.filter((cov) => {
			let value: string;
		});
	}

	// todo reproject
	async loadCovData(data: PluginOptions['data']): Promise<CoverageCollection> {
		let x: Exclude<PluginOptions['data'], string>;
		if (typeof data === 'string') {
			x = await load<CoverageJSON.CoverageJSON>(data).then((doc) => {
				if (isNdArray(doc)) throw Error(`NdArrays are not supported`);
				return doc;
			});
		} else x = data;

		switch (x.type) {
			case 'Domain':
				x = new Coverage({ type: 'Coverage', domain: x, ranges: {} });
			case 'Coverage':
				x = new CoverageCollection({ type: 'CoverageCollection', coverages: [x] });
			case 'CoverageCollection':
				if (x instanceof CoverageCollection) return x;
				return CoverageCollection.load(x);
		}
	}
	async setCovData(data: PluginOptions['data']) {
		this._coveragecollection = await this.loadCovData(data).then(async (data) => {
			if (!this.covOptions.reproject || !this._referencing) return data;
			return await data.reproject(this._referencing);
		});
		this.setData(this._coveragecollection.featurecollection);
	}
	/**
	 * Adapted closely to GeoJSON's source
	 */
	async updateCovData(diff: SourceDiff): Promise<void> {
		if (diff.add) {
			this._coveragecollection.coverages.push(...diff.add);
		}
		if (diff.remove) {
			diff.remove.forEach((id) => {
				const idx = this._coveragecollection.coverages.findIndex((cov) => cov.uuid === id);
				if (idx < 0) return;
				this._coveragecollection.coverages.splice(idx, 1);
			});
		}
		if (diff.update) {
		}
	}
}

interface SourceDiff {
	/**
	 * A list of coverage uuids to remove
	 */
	remove?: string[];
	/**
	 * Add coverages
	 */
	add?: Coverage[];
	/**
	 *
	 */
	update?: CoverageDiff[];
}

interface CoverageDiff {
	/**
	 * The uuid of the coverage
	 */
	uuid: string;
	/**
	 * The new Domain
	 */
	newDomain?: Domain;
	/**
	 *
	 */
	addOrUpdate?: {
		parameters?: Record<string, Parameter>;
		ranges?: Record<string, Range>;
		properties?: Record<string, unknown>[];
	};
}
