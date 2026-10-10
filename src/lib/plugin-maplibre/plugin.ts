import {
	type Dispatcher,
	type Evented,
	Map as MapInstance,
	GeoJSONSource,
	type MapGeoJSONFeature,
	type GeoJSONSourceDiff,
	type GeoJSONFeatureDiff
} from 'maplibre-gl';
import {
	CoverageCollection,
	type InferDomainClass,
	Range,
	Referencing,
	getDomain,
	isNdArray,
	load,
	Parameter
} from '#lib/core/index.js';
import type { BasicPluginOptions, PluginOptions } from './types.js';
import type { Domain, NdArray, Position } from 'coveragejson';
import { Coverage } from '#lib/core/coverage.js';
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
				type: 'geojson',
				promoteId: 'uuid'
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
		this.setCovData(options.data);
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

	getCoveragesFromFeatureList(features: MapGeoJSONFeature[], point: Position) {
		const featureIds = features.map(({ properties }) => properties.uuid as string);
		return this._coveragecollection.coverages
			.filter((cov) => featureIds.includes(cov.uuid))
			.map((cov) => cov.calculateIndices(point));
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
		this.covOptions?.onLoad?.(this._coveragecollection);
	}
	/**
	 * Adapted closely to GeoJSON's source
	 * @todo call the GeoJSON.updateData method
	 */
	async updateCovData(diff: SourceDiff): Promise<void> {
		const geojsonDiff: GeoJSONSourceDiff = { add: [], update: [], remove: [] };
		if (diff.add) {
			for (let cov of diff.add) {
				if (!(cov instanceof Coverage)) cov = await Coverage.load(cov);
				this._coveragecollection.coverages.push(cov);
				geojsonDiff.add?.push(cov.feature);
			}
		}
		if (diff.remove) {
			diff.remove.forEach((id) => {
				const idx = this._coveragecollection.coverages.findIndex((cov) => cov.uuid === id);
				if (idx < 0) return;
				this._coveragecollection.coverages.splice(idx, 1);
			});
		}

		if (diff.update) {
			for (const update of diff.update) {
				const idx = this._coveragecollection.coverages.findIndex((cov) => cov.uuid === update.uuid);
				if (idx < 0) continue;
				const geojsonFeatureDiff: GeoJSONFeatureDiff = { id: update.uuid };

				const cov = this._coveragecollection.coverages[idx];
				if (update.newDomain) {
					if (typeof update.newDomain === 'string') {
						update.newDomain = await load<Domain>(update.newDomain);
					}
					if (!('clone' in update.newDomain)) {
						update.newDomain = getDomain(update.newDomain);
					}
					cov.domain = update.newDomain as InferDomainClass;
					geojsonFeatureDiff.newGeometry = cov.domain.geometry;
				}
				geojsonFeatureDiff.addOrUpdateProperties = [];
				if (update.addOrUpdate?.parameters) {
					Object.entries(update.addOrUpdate.parameters).forEach(([k, v]) => {
						if (!(v instanceof Parameter)) v = new Parameter(v, k);
						cov.parameters.set(k, v);
					});
				}
				if (update.addOrUpdate?.properties) {
					geojsonFeatureDiff.addOrUpdateProperties.push(
						...Object.entries(update.addOrUpdate.properties).map(([key, value]) => ({ key, value }))
					);
					cov.properties = { ...cov.properties, ...update.addOrUpdate.properties };
				}
				if (update.addOrUpdate?.ranges) {
					Object.entries(update.addOrUpdate.ranges).forEach(([k, v]) => {
						if (typeof v !== 'string' && !(v instanceof Range)) {
							v = new Range(v);
						}
						cov.ranges.set(k, v);
					});
					geojsonFeatureDiff.addOrUpdateProperties.push({
						key: 'ranges',
						value: cov.ranges.keys().toArray()
					});
				}
				this._coveragecollection.coverages[idx] = cov;
			}
			this.updateData(geojsonDiff);
			this.covOptions.onLoad?.(this._coveragecollection);
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
	add?: (Coverage | CoverageJSON.Coverage)[];
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
	newDomain?: Domain | InferDomainClass | string;
	/**
	 *
	 */
	addOrUpdate?: {
		parameters?: Record<string, CoverageJSON.Parameter | Parameter>;
		ranges?: Record<string, Range | string | NdArray>;
		properties?: Record<string, unknown>[];
	};
}
