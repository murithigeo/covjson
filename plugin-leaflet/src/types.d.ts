import { GeoJSONOptions } from 'leaflet';
import type { Coverage, CoverageCollection, getDomain } from '@murithigeo/covjson-core';
import type {
	Coverage as CovCoverage,
	Domain as CovDomain,
	CoverageCollection as CovCollection
} from 'coveragejson';

type Domain = Awaited<ReturnType<typeof getDomain>>;

interface BasicPluginOptions {
	data: string | Coverage | CoverageCollection | CovCollection | CovDomain | CovCoverage | Domain;
	layers?: string[];
	onLoad?(coverages: Map<string, Coverage>): void;
	listenTo?: [];
}

export type PluginOptions = BasicPluginOptions & GeoJSONOptions;
