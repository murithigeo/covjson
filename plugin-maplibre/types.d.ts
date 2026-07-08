import type {
	Coverage as CovCollection,
	Domain as CovDomain,
	CoverageCollection as CovCollection
} from '../coveragejson.js';
import type { Coverage } from '../coverage.ts';
import type { getDomain } from '../domain/index.ts';
import type { CoverageCollection } from '../coverage-collection.ts';

type Domain = Awaited<ReturnType<typeof getDomain>>;
type GeoJSONSourceOptions = ConstructorParameters<typeof maplibregl.GeoJSONSource>;
export interface PluginOptions extends Omit<GeoJSONSourceOptions[0], 'data'> {
	data: Coverage | CovCollection | CovDomain | CoverageCollection | Domain | CovCoverage;
	type: 'coveragejson';
	/**
	 * Will listen on all layer events on these ids and set the e.coverages property
	 */
	layerIds?:string[]
}
