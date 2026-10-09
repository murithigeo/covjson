import type {
	Coverage as CovCoverage,
	Domain as CovDomain,
	CoverageCollection as CovCollection,
	NdArray,
	TiledNdArray
} from 'coveragejson';
import {
	type Coverage,
	CoverageCollection,
	type InferDomainClass,
	Range
} from '#lib/core/index.ts';
import {
	GeoJSONSource,
	type FillLayerSpecification,
	type GeoJSONFeatureDiff,
	type GeoJSONFeatureId,
	type LineLayerSpecification,
	type MapLayerEventType,
	type SymbolLayerSpecification
} from 'maplibre-gl';

type Domain = InferDomainClass | ReturnType<InferDomainClass['denormalize']>;
type GeoJSONSourceOptions = Omit<ConstructorParameters<typeof GeoJSONSource>[1], 'data' | 'type'>;

interface BasicPluginOptions {
	data:
		// Or instead, if it is a range, anchor to NULL Island
		| string
		| Exclude<CoverageJSON.CoverageJSON, NdArray>
		| CoverageCollection
		| Coverage
		| InferDomainClass;
	type: 'coveragejson';
	/**
	 * Keys are layerIds and the values are the events to listen to
	 * Appends the "coverages" member to the event object
	 */
	events?: Record<string, (keyof MapLayerEventType)[]>;

	/**
	 * Callback to get the data on update/set
	 */
	onLoad?: (data: CoverageCollection) => void;
	/**
	 * Whether to reproject from the CoverageJSON's native CRS to OGC:CRS84
	 * If you know that data is OGC:CRS84, then pass false
	 */
	reproject?: boolean;
	/**
	 * @default {uuid}
	 */
	promoteId?: string | string;
}

export type PluginOptions = BasicPluginOptions & GeoJSONSourceOptions;

/**
 * Similar to {@see GeoJSONSourceDiff}
 */
export interface CoverageJSONSourceDiff {
	/**
	 * When true, remove all coverages/data
	 */
	removeAll?: boolean;
	/**
	 * The IDs of Coverages to remove
	 */
	remove?: GeoJSONFeatureId;
	/**
	 *
	 */
	add?: CoverageJSON.Coverage[];
	/**
	 * An array of update objects
	 */
	update?: CoverageJSONCoverageDiff;
}

export interface CoverageJSONCoverageDiff extends Omit<GeoJSONFeatureDiff, 'newGeometry'> {
	/**
	 * The id of the Coverage
	 */
	newDomain?: CoverageJSON.Domain;
	/**
	 * Will clear the "parameters" and "ranges" map, "parameterGroups"
	 * And anything else in the "properties" object
	 */
	removeAllProperties?: boolean;
	/**
	 * The properties to update
	 */
	addOrUpdateProperties?: { key: string; value: unknown }[];
}
