import type { DomainTypes } from 'coveragejson';
import type { Geometry, Feature } from 'geojson';

interface CoverageProperties<DT extends DomainTypes> {
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
export type CoverageAsFeature<DT extends DomainTypes, G extends Geometry> = Feature<
	G,
	CoverageProperties<D>
>;
