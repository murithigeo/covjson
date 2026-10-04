import type {
	Coverage as CovCoverage,
	Domain as CovDomain,
	CoverageCollection as CovCollection
} from 'coveragejson';
import { Coverage, CoverageCollection, getDomain } from '@murithigeo/covjson-core';
import {
	GeoJSONSource,
	type FillLayerSpecification,
	type LineLayerSpecification,
	type MapLayerEventType,
	type SymbolLayerSpecification
} from 'maplibre-gl';

type Domain = Awaited<ReturnType<typeof getDomain>>;
type GeoJSONSourceOptions = Omit<ConstructorParameters<typeof GeoJSONSource>[1], 'data' | 'type'>;

interface BasicPluginOptions {
	data: string | Coverage | CovCollection | CovDomain | CoverageCollection | Domain | CovCoverage;
	type: 'coveragejson';
	/**
	 * Will listen on all layer events on these ids and set the e.coverages property
	 */
	layers?: string[];

	/**
	 * Callback to get the data on update/set
	 */
	onLoad?: (data: CoverageCollection) => void;
	/**
	 * Events to listen to automatically and determine matching features
	 */
	listenTo?: Array<keyof MapLayerEventType>;
	/**
	 * Whether to reproject from the CoverageJSON's native CRS to OGC:CRS84
	 * If you know that data is OGC:CRS84, then pass false
	 */
	reproject?: boolean;
	/**
	 * The paint properties of the temporary layer that highlights the clicked domain values
	 */
	tempLayerPaint?: {
		symbol?: SymbolLayerSpecification['paint'];
		line?: LineLayerSpecification['paint'];
		fill?: FillLayerSpecification['paint'];
	};
}
export type PluginOptions = BasicPluginOptions & GeoJSONSourceOptions;
