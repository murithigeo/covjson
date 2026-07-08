import maplibregl from "maplibre-gl";
import type { Domain, NdArray, CoverageJSON } from "../core/coveragejson.d.ts";
import {
  Coverage,
  CoverageCollection,
  getDomain,
  load,
} from "@murithigeo/covjson-core";
type DomainClass = Awaited<ReturnType<typeof getDomain>>;
/**
 * @see {maplibregl.GeoJSONSourceDiff}
 */
export interface CovJsonSourceDiff {
  /**
   * When set to `true` it will remove all coverages
   */
  removeAll?: boolean;
  /**
   * An array of Coverage IDs to remove
   */
  remove?: string[];
  /**
   * An array of coverages to add
   * @todo allow coveragejson.coverage by excluding string domains
   */
  add?: Coverage[];
  /**
   * An array of update objects
   */
  update?: CoverageDiff[];
}

/**
 * @see {maplibregl.GeoJSONFeatureDiff}
 */
interface CoverageDiff {
  /**
   * The coverage ID
   */
  id: string;
  /**
   * If it's a new domain, place it here
   * @todo make processDomain synchronous either by reusing definitions
   */
  newDomain?: DomainClass | Domain;
  /**
   * The properties keys to remove. Will skip `ranges`,`type` if specified
   */
  removeProperties?: string[];
  /**
   * The properties to add or update alongside their values
   * Does not support non-optional properties
   */
  addOrUpdateProperties?: Array<{ key: string; value: unknown }>;
}

export function applyCovJsonSourceDiff(
  updateable: Map<string, Coverage>,
  diff: CovJsonSourceDiff,
  promoteId?: string,
): {
  updateable: Map<string, Coverage> | undefined;
  diff: maplibregl.GeoJSONSourceDiff;
} {
  const geodiff: maplibregl.GeoJSONSourceDiff = {};
  const affectedDomains: DomainClass[] = [];

  if (diff.removeAll) updateable.clear();
  else if (diff.remove) {
  }

  if (diff.add) {
    for (const coverage of diff.add) {
      const id = getCoverageId(coverage, promoteId);
      if (!id) continue;

      const existing = updateable.get(id);
      if (existing) affectedDomains.push(existing.domain);

      affectedDomains.push(coverage.domain);
      updateable.set(id, coverage);
    }
  }

  if (diff.update) {
    for (const update of diff.update) {
      const existing = updateable.get(update.id);
      if (!existing) continue;
    }
  }
  return { updateable, diff: geodiff };
}

export function getCoverageId(data: Coverage, promoteId = "uuid"): string {
  //@ts-expect-error todo add {[x:string]:any} to the coveragejson types
  return promoteId in data ? data[promoteId] : data.properties[promoteId];
}

export async function loadCovJson(
  data: string | Exclude<CoverageJSON, NdArray>,
) {
  if (typeof data === "string") {
    data = await load<Exclude<CoverageJSON, NdArray>>(data);
    if (["TiledNdArray", "NdArray"].includes(data.type))
      throw Error(`Maplibre does not support NdArrays`);
  }
  if (data.type === "Domain")
    data = { type: "Coverage", domain: data, ranges: {} };
  if (data.type === "Coverage")
    data = { type: "CoverageCollection", coverages: [data] };
  return CoverageCollection.load(data)
    .then((cov) => cov.reproject({ crsId: "OGC:CRS84" }))
    .then((cov) => cov.coverages);
}
