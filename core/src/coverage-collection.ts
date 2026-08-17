import type {
  Domain,
  ReferenceSystemConnection,
  CoverageCollection as CovColl,
  Coverage as CRG,
  NdArray as Nd,
  Position
} from 'coveragejson';
import { Parameter, ParameterGroup } from './parameters.ts';
import { Coverage, type CoverageOptions, type DataRow } from './coverage.ts';
import { Referencing, type UserReferencingOptions } from './referencing.ts';
import { Base } from './base.ts';
import type { FeatureCollection } from 'geojson';
import type { InferDomainClass } from './domain/types.d.ts';
import { minMax, type MinMax, type WithRequiredProperty } from './utils.ts';

export class CoverageCollection<T extends Domain = Domain> extends Base<CovColl<T>> {
  _reproject(): this {
    throw Error('Method not implemented. Use reproject instead');
  }
  type: 'CoverageCollection';
  coverages: Coverage<T>[];
  #referencing?: ReferenceSystemConnection[] | undefined;
  domainType?: InferDomainClass<T>['domainType'];
  #parameters: Map<string, Parameter>;
  parameterGroups: ParameterGroup[];
  properties: Record<string, unknown>;
  /**
   * Key is the range name and value the bounds.
   */
  minMax: Record<string, MinMax>;
  options: WithRequiredProperty<CoverageOptions, 'ranges'>;
  constructor(
    doc: Omit<CovColl, 'coverages'> & {
      coverages: ((CRG<T> & { ranges: Record<string, Nd> }) | Coverage<T>)[];
    },
    options: CoverageOptions
  ) {
    super();
    const {
      type,
      domainType,
      coverages,
      referencing,
      parameterGroups = [],
      parameters = {},
      ...properties
    } = doc;
    this.options = { ...options, ranges: options.ranges || {} };
    this.type = type;
    this.domainType = domainType;
    this.parameterGroups = parameterGroups.map((e) => new ParameterGroup(e));
    this.#referencing = referencing;
    this.properties = properties;
    this.#parameters = new Map();
    for (const id in this.parameters) {
      this.#parameters.set(id, new Parameter(parameters[id], id, this.options.language));
    }
    this.minMax = {};

    /**
     * Piggy back on the options to get make minMax dynamic
     */
    for (const id in this.#parameters.keys()) {
      const option = this.options.ranges[id] || {};
      option.syncMinMax = (minMax) => {
        this.updateMinMax(id, minMax);
        return option.syncMinMax?.(minMax);
      };
      this.minMax[id] = [null, null];
      this.options.ranges[id] = option;
    }
    this.coverages = coverages.map((cov) => {
      if (!(cov instanceof Coverage)) cov = new Coverage(cov, options);
      if (!cov.domain.referencing && this.referencing) cov.domain.referencing = this.referencing;
      cov.ranges.keys().forEach((id) => {
        if (!cov.parameters.has(id)) cov.parameters.set(id, this.parameters.get(id)!);
        // todo copy Parameter Groups too
      });
      return cov;
    });
  }
  updateMinMax(id: string, newBounds: MinMax) {
    this.minMax[id] = minMax([...newBounds, ...this.minMax[id]]);
  }
  static async load<T extends Domain>(
    doc: CovColl<T | string>,
    options: CoverageOptions
  ): Promise<CoverageCollection<T>> {
    return new CoverageCollection(
      {
        ...doc,
        coverages: await Promise.all(doc.coverages.map((cov) => Coverage.resolve(cov)))
      },
      options
    );
  }
  denormalize() {
    for (const coverage of this.coverages) coverage.denormalize();
    return this;
  }
  normalize() {
    for (const coverage of this.coverages) coverage.normalize();
  }
  reproject(referencing: Referencing, force: true): this;
  reproject(referencing: Referencing, force?: false): Promise<this>;
  reproject(referencing: UserReferencingOptions, force?: false): Promise<this>;
  reproject(
    referencing: Referencing | UserReferencingOptions,
    force?: boolean
  ): this | Promise<this> {
    if (referencing instanceof Referencing && force) {
      this.coverages = this.coverages.map((cov) => {
        cov = cov.reproject(referencing, true);
        cov.domain.referencing = undefined; // No need to keep copies of the same thing
        return cov;
      });

      return this;
    }
    return Promise.all(this.coverages.map((cov) => cov.reproject(referencing))).then(
      (coverages) => {
        this.#referencing = coverages[0].referencing; // Get a copy from the first coverage;
        this.coverages = coverages.map((cov) => {
          cov.domain.referencing = undefined; // No need to keep copies of the same thing
          return cov;
        });

        return this;
      }
    );
  }

  // Add referencing memeber behavior
  toPlain(): CovColl<T> {
    return {
      type: this.type,
      //@ts-expect-error upstream conflict
      domainType: this.domainType,
      coverages: this.coverages.map((cov) => cov.toPlain()),
      parameters: this.parameters
        .entries()
        .reduce((l, [id, param]) => ({ ...l, [id]: param.toPlain() }), {}),
      parameterGroups: this.parameterGroups.map((e) => e.toPlain()),
      referencing: this.referencing
    };
  }
  get featurecollection(): FeatureCollection<
    InferDomainClass<T>['geometry'],
    { uuid: string; domainType: T['domainType'] }
  > {
    return {
      type: 'FeatureCollection',
      features: this.coverages.map((cov) => cov.feature)
    };
  }
  get referencing() {
    return this.#referencing;
  }
  get z(): number[] {
    return new Set(this.coverages.flatMap(({ domain }) => domain.z))
      .keys()
      .toArray()
      .sort((a, b) => a - b);
  }
  get t(): string[] {
    return new Set(this.coverages.flatMap(({ domain }) => domain.t))
      .keys()
      .toArray()
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }
  private set referencing(referencing: ReferenceSystemConnection[] | undefined) {
    this.#referencing = referencing;
  }

  /**
   * Simple function to retrieve a list of data values.
   * For eagerLoading data, see @see {query}
   */
  getData(ref: Position | string | number, rangeIds?: string[]) {
    return Promise.all(this.coverages.map((cov) => cov.getData(ref, rangeIds)));
  }
  /**
   * @param axisNames Axis names to preload data for
   */
  query(...axisNames: string[]) {
    const awaiting = this.coverages.map((cov) => cov.query(...axisNames));
    return (ref: Position | string | number, rangeIds?: string[]) =>
      awaiting.map((query) => query(ref, rangeIds));
  }
  /**
   * Recompile list of parameters from constituent coverages
   * If the parameter is referenced by more than 1 coverage, it is deleted from all coverages
   */
  get parameters(): Map<string, Parameter> {
    for (const cov of this.coverages) {
      cov.parameters.forEach((v, k) => {
        if (this.#parameters.has(k)) return;
        this.#parameters.set(k, v);
      });
    }
    return this.#parameters;
  }
}
