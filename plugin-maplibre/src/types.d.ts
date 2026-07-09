import type {
  Coverage as CovCoverage,
  Domain as CovDomain,
  CoverageCollection as CovCollection,
} from "../../core/src/coveragejson.d.ts";
import {
  Coverage,
  CoverageCollection,
  getDomain,
} from "@murithigeo/covjson-core";
import type maplibregl from "maplibre-gl";

type Domain = Awaited<ReturnType<typeof getDomain>>;
type GeoJSONSourceOptions = ConstructorParameters<
  typeof maplibregl.GeoJSONSource
>;
export interface PluginOptions extends Omit<
  GeoJSONSourceOptions[1],
  "data" | "type"
> {
  data:
    | string
    | Coverage
    | CovCollection
    | CovDomain
    | CoverageCollection
    | Domain
    | CovCoverage;
  type: "coveragejson";
  /**
   * Will listen on all layer events on these ids and set the e.coverages property
   */
  layerIds?: string[];
}
