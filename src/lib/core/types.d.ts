import type { DomainTypes, Domain } from 'coveragejson';
import type { Geometry, Feature } from 'geojson';
import type { DataValue } from './coverage';
import { Range } from './ranges';
export interface CoverageProperties<DT extends DomainTypes> {
	/**
	 * Other properties not explicitly declared in schema
	 */
	[x: string]: unknown;
	uuid: string;
	domainType: DT;
	/**
	 * The names of ranges in the coverage
	 */
	parameters: string[];
	/**
	 *
	 */
	id?: string;
}

/**
 * Callback to execute if a TiledNdArray's value has been freshly retrieved
 */
type OnNonCacheFetch = (range: Range) => void;
/**
 *
 */

type CoverageNonCacheFetch = (k: string, v: Range) => void;
/**
 * The Domain's axes keys and their sizes
 */
type DomainIndices<D extends Domain = Domain> = Record<keyof D, number>;

type RangeIndices = Record<string, number> | number[];

interface QueryOptions {
	/**
	 * Boolean selects all indices
	 * Number Array for specific values
	 * Unbounded object for range
	 */

	axisNames?: Record<string, AxisNamesOptions>;
	/**
	 * The ranges to query
	 */
	ranges?: string[];
	/**
	 * Callback to executed if the data value was not previously cached
	 */
	cb?(name: string, range: Range): void;
}

export type GetDataOptions = Exclude<QueryOptions, 'axisNames'>;

export type AxisNamesOptions = number[] | Partial<Record<'start' | 'stop', number>>;
