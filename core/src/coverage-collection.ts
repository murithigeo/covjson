import type {
  Domain,
  ReferenceSystemConnection,
  CoverageCollection as CovColl,
  Coverage as CRG,
  NdArray as Nd,
} from "./coveragejson.d.ts";
import { Parameter, ParameterGroup } from "./parameters.ts";
import { Coverage } from "./coverage.ts";
import { Referencing, type UserReferencingOptions } from "./referencing.ts";
import { Base } from "./base.ts";
import type { GeoJSON } from "geojson";

export class CoverageCollection<T extends Domain = Domain> extends Base<
  CovColl<T>
> {
  _reproject(): this {
    throw Error("Method not implemented.");
  }
  type: "CoverageCollection";
  coverages: Coverage<T>[];
  #referencing?: ReferenceSystemConnection[] | undefined;
  domainType?: CoverageJSON.CoverageCollection<T>["domainType"];
  parameterGroups: ParameterGroup[];
  constructor(
    doc: Omit<CovColl, "coverages"> & {
      coverages: (CRG<T> & { ranges: Record<string, Nd> })[];
    },
  ) {
    super();
    this.type = doc.type;

    doc.parameters = doc.parameters || {};
    const parameters = new Map(
      Object.keys(doc.parameters).map((id) => [
        id,
        new Parameter(doc.parameters![id]),
      ]),
    );
    this.parameterGroups = (doc.parameterGroups || []).map(
      (e) => new ParameterGroup(e),
    );
    this.#referencing = doc.referencing;

    this.coverages = doc.coverages.map((cov) => {
      const cov_ = new Coverage(cov);
      if (!cov_.domain.referencing && this.referencing)
        cov_.domain.referencing = this.referencing;
      // Ensure that each coverage has a copy of the parameters and parameterGroups
      parameters.entries().forEach(([k, v]) => cov_.addParameter(k, v));
      this.parameterGroups.forEach((v) => cov_.addParameterGroup(v));
      return cov_;
    });
  }

  static async load<T extends Domain>(
    doc: CovColl<T | string>,
  ): Promise<CoverageCollection<T>> {
    const coverages = await Promise.all(
      doc.coverages.map((cov) => Coverage.resolve(cov)),
    );
    return new CoverageCollection({
      ...doc,
      coverages,
    });
  }
  denormalize() {
    for (const coverage of this.coverages) {
      coverage.denormalize();
    }
    return this;
  }
  normalize() {
    for (const coverage of this.coverages) {
      coverage.normalize();
    }
  }
  reproject(referencing: Referencing, force: true): this;
  reproject(referencing: Referencing, force?: false): Promise<this>;
  reproject(referencing: UserReferencingOptions, force?: false): Promise<this>;
  reproject(
    referencing: Referencing | UserReferencingOptions,
    force?: boolean,
  ): this | Promise<this> {
    if (referencing instanceof Referencing && force) {
      this.coverages = this.coverages.map((cov) => {
        cov = cov.reproject(referencing, true);
        cov.domain.referencing = undefined; // No need to keep copies of the same thing
        return cov;
      });

      return this;
    }
    return Promise.all(
      this.coverages.map((cov) => cov.reproject(referencing, false)),
    ).then((coverages) => {
      this.#referencing = coverages[0].referencing; // Get a copy from the first coverage;
      this.coverages = coverages.map((cov) => {
        cov.domain.referencing = undefined; // No need to keep copies of the same thing
        return cov;
      });

      return this;
    });
  }

  // Add referencing memeber behavior
  toPlain(): CovColl<T> {
    return {
      type: this.type,
      domainType: this.domainType,
      coverages: this.coverages.map((cov) => cov.toPlain()),
      parameters: this.parameters
        .entries()
        .reduce((l, [id, param]) => ({ ...l, [id]: param.toPlain() }), {}),
      parameterGroups: this.parameterGroups.length
        ? this.parameterGroups.map((e) => e.toPlain())
        : undefined,
      referencing: this.referencing,
    };
  }
  get featurecollection(): GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    { id: string }
  > {
    return {
      type: "FeatureCollection",
      features: this.coverages.map((cov) => cov.feature),
    };
  }
  public get referencing() {
    return this.#referencing;
  }
  private set referencing(
    referencing: ReferenceSystemConnection[] | undefined,
  ) {
    this.#referencing = referencing;
  }

  async getData(point: [number, number], rangeIds: string[]) {
    rangeIds = rangeIds.map((id) => id.toUpperCase());
    return await Promise.all(
      this.coverages.map((coverage) => coverage.getData(point, rangeIds)),
    );
  }
  /**
   * Recompile list of parameters from constituent coverages
   * If the parameter is referenced by more than 1 coverage, it is deleted from all coverages
   */
  get parameters(): Map<string, Parameter> {
    const params = new Map<string, Parameter>();
    // const counts = new Map<string, number>();
    // for (const cov of this.coverages) {
    // 	for (const id of cov.parameters.keys()) counts.set(id, (counts.get(id) || 0) + 1);
    // }
    for (const cov of this.coverages) {
      for (const [id, param] of cov.parameters.entries()) {
        if (params.has(id)) continue;
        params.set(id, param);
      }
    }
    return params;
  }
}
// use intersects to calculate ranges intersecting with the map view
