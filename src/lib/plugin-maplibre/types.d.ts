import { type Coverage, CoverageCollection, type InferDomainClass } from '#lib/core/index.js';
import { type GeoJSONSourceSpecification } from 'maplibre-gl';
import type { Coverage as Cov, CoverageCollection as CovColl, Domain } from 'coveragejson';
// type Domain = InferDomainClass | ReturnType<InferDomainClass['denormalize']>;
type GeoJSONSourceOptions = Omit<GeoJSONSourceSpecification, 'data' | 'type'>;

export interface PluginOptions<D extends Domain = Domain> extends GeoJSONSourceOptions {
	data:
		// Or instead, if it is a range, anchor to NULL Island
		string | Cov<D> | CovColl<D> | D | Coverage<D> | InferDomainClass<D> | CoverageCollection<D>;
	type: 'coveragejson';

	/**
	 * Callback to execute when data is set or updated
	 */
	onData?: (data: CoverageCollection<D>) => void;
	/**
	 * Whether to reproject from the CoverageJSON's native CRS to OGC:CRS84
	 * If you know that data is OGC:CRS84, then pass false
	 */
	reproject?: boolean;
	/**
	 * Handle when a range is loaded instead of a Coverage,CoverageCollection or Domain
	 */
	onRangeLoadError?: (data: PluginOptions<D>['data']) => void;
}

interface SourceDiff<D extends Domain = Domain> {
	/**
	 * A list of coverage uuids to remove
	 */
	remove?: string[];
	/**
	 * Add coverages
	 */
	add?: (Coverage<D> | CoverageJSON.Coverage<D>)[];
	/**
	 *
	 */
	update?: CoverageDiff<D>[];
}

interface CoverageDiff<D extends Domain = Domain> {
	/**
	 * The uuid of the coverage
	 */
	uuid: string;
	/**
	 * The new Domain
	 */
	newDomain?: D | InferDomainClass<D> | string;
	/**
	 *
	 */
	addOrUpdate?: {
		parameters?: Record<string, CoverageJSON.Parameter | Parameter>;
		ranges?: Record<string, Range | string | NdArray>;
		properties?: Record<string, unknown>[];
	};
}
