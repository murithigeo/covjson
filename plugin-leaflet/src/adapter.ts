import { FeatureGroup, GeoJSON, geoJSON, geoJson } from 'leaflet'; // Alpha
import { Coverage } from '@murithigeo/covjson-core';
import type { BasicPluginOptions, PluginOptions } from './types.d.ts';

export class CoverageJSONLayer extends GeoJSON {
	covOptions: BasicPluginOptions;
	constructor(options: PluginOptions) {
		super(null, options);
		this.covOptions = options;
	}
}

export class LeafletPlugin extends FeatureGroup {
	covLayer: CoverageJSONLayer;
	constructor(options: PluginOptions) {
		super();
		this.covLayer = new CoverageJSONLayer(options);
	}
}
