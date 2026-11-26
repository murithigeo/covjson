import {
	type Dispatcher,
	type Evented,
	GeoJSONSource,
	type MapGeoJSONFeature,
	type GeoJSONSourceDiff,
	type GeoJSONFeatureDiff,
	LngLat
} from 'maplibre-gl';
import {
	CoverageCollection,
	type InferDomainClass,
	Range,
	Referencing,
	getDomain,
	isNdArray,
	load,
	Parameter,
	isNull,
	CRS84,
	type WithRequiredProperty
} from '#lib/core/index.js';
import type { PluginOptions, CoverageJSONSourceDiff } from './types.js';
import type { Domain, Position } from 'coveragejson';
import { Coverage } from '#lib/core/coverage.js';
import type { Feature } from 'geojson';
export class MaplibrePlugin<D extends Domain = Domain> extends GeoJSONSource {
	_coveragecollection: CoverageCollection<D>;
	_referencing?: Referencing;
	options: WithRequiredProperty<PluginOptions<D>, 'onRangeLoadError'>;
	constructor(
		id: string,
		options: PluginOptions<D>,
		dispatcher: Dispatcher,
		eventedParent: Evented
	) {
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

		this.options = {
			...options,
			onRangeLoadError(data) {
				if (options.onRangeLoadError) return options.onRangeLoadError(data);
				console.error('This plugin does not support top level NdArrays', JSON.stringify(data));
			}
		};
		this._coveragecollection = new CoverageCollection({
			type: 'CoverageCollection',
			coverages: []
		});
		this.setCovData(options.data);
		if (options.reproject) {
			new Referencing()
				.to({ crs: { id: CRS84, z: false } })
				.then((ref) => (this._referencing = ref));
		}
	}

	getCoveragesFromFeatureList(features: (MapGeoJSONFeature | Feature)[], point: Position | LngLat) {
		const featureIds = features
			.filter((d) => !isNull(d.properties))
			.map(({ properties }) => properties!.uuid as string);
		if (point instanceof LngLat) point = point.wrap().toArray();
		return this._coveragecollection.coverages
			.filter((cov) => featureIds.includes(cov.uuid))
			.map((cov) => {
				cov.domain.referencing = this._coveragecollection.referencing;
				return cov.calculateIndices(point);
			});
	}

	// todo reproject
	async loadCovData(data: PluginOptions<D>['data']): Promise<CoverageCollection<D>> {
		if (typeof data !== 'object') {
			const _data = await load<CoverageJSON.CoverageJSON>(data);
			if (isNdArray(_data)) throw this.options.onRangeLoadError(this.options.data);
			data = _data as Exclude<PluginOptions<D>['data'], string>;
		}

		switch (data.type) {
			case 'Domain':
				data = new Coverage<D>({ type: 'Coverage', domain: data, ranges: {} });
			// eslint-disable-next-line no-fallthrough
			case 'Coverage':
				data = new CoverageCollection({ type: 'CoverageCollection', coverages: [data] });
			// eslint-disable-next-line no-fallthrough
			case 'CoverageCollection':
				if (data instanceof CoverageCollection) return data;
				return CoverageCollection.load<D>(data);
		}
	}
	async setCovData(data: PluginOptions<D>['data']) {
		this._coveragecollection = new CoverageCollection({
			type: 'CoverageCollection',
			coverages: []
		});
		this._coveragecollection = await this.loadCovData(data).then(async (data) => {
			for (let i = 0; i < data.coverages.length; i++) {
				const cov = data.coverages[i];
				[...cov._ranges.keys(), ...cov.ranges.keys()]
					.filter((k) => !cov.parameters.has(k))
					.forEach((k) => {
						const param = data.parameters.get(k);
						if (!param) return;
						cov.parameters.set(k, param);
					});
				data.coverages[i] = cov;
			}
			if (!this._referencing) return data;
			return await data.reproject(this._referencing);
		});

		this.setData(this._coveragecollection.featurecollection);
		this.options?.onData?.(this._coveragecollection);
	}
	/**
	 * Adapted closely to GeoJSON's source
	 * @todo call the GeoJSON.updateData method
	 */
	async updateCovData(diff: CoverageJSONSourceDiff<D>): Promise<void> {
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
						update.newDomain = await load<D>(update.newDomain);
					}
					if (!('clone' in update.newDomain)) {
						update.newDomain = getDomain(update.newDomain);
					}
					cov.domain = update.newDomain as InferDomainClass<D>;
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
						if (typeof v === 'string') {
							return cov._ranges.set(k, v);
						}
						if (!(v instanceof Range)) v = new Range(v);
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
			this.options.onData?.(this._coveragecollection);
		}
	}
}
