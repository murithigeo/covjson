import type { NdArray } from 'coveragejson';
import { type Coverage, CoverageCollection, type InferDomainClass } from '#lib/core/index.ts';
import {
	GeoJSONSource,
	type MapLayerEventType,
	type GeoJSONSourceSpecification
} from 'maplibre-gl';

type Domain = InferDomainClass | ReturnType<InferDomainClass['denormalize']>;
type GeoJSONSourceOptions = Omit<GeoJSONSourceSpecification, 'data' | 'type'>;

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
	 * Callback to execute when data is set or updated
	 */
	onData?: (data: CoverageCollection) => void;
	/**
	 * Whether to reproject from the CoverageJSON's native CRS to OGC:CRS84
	 * If you know that data is OGC:CRS84, then pass false
	 */
	reproject?: boolean;
}

export type PluginOptions = BasicPluginOptions & GeoJSONSourceOptions;
