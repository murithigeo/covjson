import type { Coverage as CRG, Domain, NdArray as Nd, Position } from 'coveragejson';
import { Base, type ReferenceArgument } from './base.ts';
import { Parameter, ParameterGroup } from './parameters.ts';
import { BaseDomain, getDomain, type GridType } from './domain/index.ts';
import { load } from './load.ts';
import type { InferDomainClass, WithoutRegularlySpacedAxis } from './domain/types.d.ts';
import { Referencing } from './referencing.ts';
import { NdArray, type NdArrayOptions } from './ranges.ts';
import { nanoid } from 'nanoid';
import type { Feature } from 'geojson';
import { cartesianProduct } from './utils.ts';

/**
 * Add a function to forcibly set each ranges minMax externally
 */
export interface CoverageOptions {
  /**
   * Options to be applied to each ndarray
   */
  ranges?: Record<string, NdArrayOptions>;
  /**
   * The preferred language of any parameters
   * @see {I18N} for more details
   */
  language?: string;
  /**
   * @link https://en.wikipedia.org/wiki/Arakawa_grids
   * @default C
   */
  gridType?: GridType;
}
export class Coverage<
  D extends Domain = Domain,
  ID extends InferDomainClass<D> = InferDomainClass<D>
> extends Base<CRG<D>> {
  get t(): string[] {
    return this.domain.t;
  }
  get z(): number[] {
    return this.domain.z;
  }
  type: 'Coverage';
  id?: string | undefined;
  domain: ID;
  properties: Record<string, unknown>;
  domainType: ID['domainType'];
  parameters: Map<string, Parameter>;
  parameterGroups: ParameterGroup[];
  ranges: Map<string, NdArray>;
  uuid: string;
  indices: Map<string, number>;
  options: CoverageOptions;
  constructor(
    coverage: CRG<D | ID> & { ranges: Record<string, Nd> },
    options: CoverageOptions = {}
  ) {
    super();
    const {
      type,
      domain,
      domainType,
      ranges,
      parameterGroups = [],
      parameters = {},
      id,
      ...properties
    } = coverage;
    this.type = type;
    this.id = id;
    this.domain = domain instanceof BaseDomain ? domain : getDomain<D>(domain, options);
    this.domainType = this.domain.domainType || domainType;

    this.ranges = new Map();
    for (const id in ranges)
      this.ranges.set(id.toUpperCase(), new NdArray(ranges[id], options.ranges?.[id]));

    this.parameters = new Map();
    for (const id in parameters)
      this.parameters.set(
        id.toUpperCase(),
        new Parameter(parameters[id], id.toUpperCase(), options.language)
      );

    this.parameterGroups = parameterGroups.map((e) => new ParameterGroup(e));
    this.properties = properties;
    this.uuid = nanoid();
    this.indices = new Map(Object.keys(this.domain.axes).map((k) => [k, 0]));
    this.options = options;
  }

  static async resolve<T extends Domain>(
    coverage: CRG<T | string>
  ): Promise<
    CRG<T> & {
      ranges: Record<string, Nd>;
    }
  > {
    if (typeof coverage.domain === 'string') coverage.domain = await load<T>(coverage.domain);
    coverage.domain.domainType = coverage.domain.domainType || coverage?.domainType;

    const ranges: Record<string, Nd> = {};
    for (const id in coverage.ranges) {
      let range = coverage.ranges[id];
      if (typeof range === 'string') range = await load<Nd>(range);
      ranges[id] = range;
    }
    let domain: T;
    if (typeof coverage.domain === 'string') domain = await load<T>(coverage.domain);
    else domain = coverage.domain;

    return {
      ...coverage,
      //@ts-expect-error error in types upstream
      domainType: domain.domainType,
      domain,
      ranges
    };
  }
  static async load<T extends Domain = Domain>(
    coverage: CRG<T | string> | string,
    options?: CoverageOptions
  ): Promise<Coverage<T>> {
    if (typeof coverage === 'string') coverage = await load<CRG<T>>(coverage);

    return Coverage.resolve<T>(coverage).then((cov) => new Coverage(cov, options));
  }

  /**
   * Assumes that the domain contained has implemented the method
   */
  denormalize(): Omit<this, 'domain'> & {
    domain: WithoutRegularlySpacedAxis<ID>;
  } {
    this.domain.denormalize?.();
    //@ts-expect-error some bs
    return this;
  }

  normalize(): this {
    this.domain.normalize?.();
    return this;
  }

  get feature(): Feature<
    ID['geometry'],
    { uuid: string; domainType: ID['domainType']; parameters: string[] }
  > {
    return {
      type: 'Feature',
      geometry: this.domain.geometry,
      properties: {
        uuid: this.uuid,
        domainType: this.domainType, // Allow filtering for maplibregl
        parameters: this.ranges.keys().toArray()
      }
    };
  }

  /**
   * Return a dictionary of axes which intersect with POI, elevation or time
   */
  queryIndices(ref: Position | string | number) {
    const indices: Map<string, number> = this.domain.queryIndices(ref);
    for (const [axisName, index] of indices) {
      if (!this.axesSize.has(axisName)) indices.delete(axisName);
      if (index < 0) indices.set(axisName, 0);
    }
    return indices;
  }
  /**
   * Calculates the indices given a reference dimension and overwrites @see {indices}.
   * Is used in the maplibre and leaflet extensions
   */
  calculateIndices(ref: Position | string | number): this {
    this.indices = new Map(this.queryIndices(ref).entries());
    return this;
  }
  /**
   * @todo add explicit types that it returns {ranges:Record<string,Nd>}
   */
  toPlain(): CRG<D> {
    //@ts-expect-error domainType conflict upstream
    return structuredClone({
      type: this.type,
      domain: this.domain.toPlain(),
      ranges: this.ranges.entries().reduce((l, r) => ({ ...l, [r[0]]: r[1].toPlain() }), {}),
      domainType: this.domain.domainType,
      parameters: this.parameters
        .entries()
        .reduce((l, r) => ({ ...l, [r[0]]: r[1].toPlain() }), {}),
      parameterGroups: this.parameterGroups.map((v) => v.toPlain())
    });
  }
  _reproject(referencing: Referencing): this {
    this.domain._reproject(referencing);
    return this;
  }
  /**
   * Returns the domain's referencing property
   */
  get referencing() {
    return this.domain.referencing;
  }
  /**
   *
   * @param point The point to get data for
   * @param rangeIds The parameter IDs to get data for. Should be in uppercase
   * @returns {Promise<Record<string,RangeValue|undefined>>} If the range does not exist, the value is undefined
   * @todo Check that loaded values are persisted once loaded (range is replaced)
   * @example
   *  const data=await coverage.getData([0,0],["QC","POTM","x"])
   *  data==={"QC":50,"POTM":100,"x":undefined}
   */
  async getData(ref: ReferenceArgument, rangeIds = this.ranges.keys().toArray()): Promise<DataRow> {
    if (!(ref instanceof Map)) ref = this.queryIndices(ref);

    const values = rangeIds
      .map((id) => id.toUpperCase())
      .filter((id) => this.ranges.has(id))
      .map(async (id) => [id, await this.ranges.get(id)!.get(ref)] as const);

    const row = Object.fromEntries(await Promise.all(values));
    ref.forEach((value, key) => {
      if (!this.axesSize.has(key)) return;

      if (key === 't' || key === 'z') row[key] = this[key][value];
      else row[`${key}Index`] = value;
    });
    return row;
  }

  get axesSize(): Map<string, number> {
    return this.domain.axesSize;
  }

  /**
   * Similar to getData but allows fetching multiple dimensions in a fell swoop
   * @param axisNames A list of axisNames whose whose values will be preloaded
   * @example
   * // In a grid, you might want to preload all z axis values while using a particular t axis value
   * query("z") === [{z:0,POTM:10},{z:1,POTM:20}] etc
   */
  query(...axisNames: string[]) {
    const consider = this.axesSize
      .entries()
      .filter(([axisName, count]) => count > 1 && axisNames.includes(axisName)) // count>1 means filtering out 1D values
      .map(([axisName, count]) => [axisName, [...Array(count).keys()]] as const)
      .toArray();

    const axisIndices = consider.map(([, indices]) => indices.map((idx) => idx)); // Remove readonly marker
    const prod = cartesianProduct<number>(...axisIndices).map(
      (combo) => new Map(combo.map((idx, i) => [consider[i][0], idx]))
    );

    return (ref: ReferenceArgument, rangeIds?: string[]) => {
      if (!(ref instanceof Map)) ref = this.queryIndices(ref);
      const rows = prod
        .map((indices) => new Map([...ref, ...indices]))
        .map(async (indices) => this.getData(indices, rangeIds));
      //todo return an object where {string:DataRow[],numeric:DataRow<number>}
      return Promise.all(rows);
    };
  }
}

export type DataValue = string | number | null;
export type DataRow<T extends DataValue = DataValue> = Record<string, T | null> & {
  t?: string;
  z?: number;
  xIndex?: number;
  yIndex?: number;
  compositeIndex?: number;
};
