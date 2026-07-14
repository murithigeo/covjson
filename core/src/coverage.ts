import type {
  Coverage as CRG,
  Domain,
  Parameter as CovParam,
  ParameterGroup as CovPGroup,
  NdArray as Nd,
  Position2D,
  Position,
} from './coveragejson.d.ts';
import { Base } from './base.ts';
import { Parameter, ParameterGroup } from './parameters.ts';
import { getDomain } from './domain/index.ts';
import { load } from './load.ts';
import type { InferDomainClass, WithoutRegularlySpacedAxis } from './domain/types.d.ts';
import { Referencing } from './referencing.ts';
import { NdArray } from './ranges.ts';
import type { WithRequiredProperty } from './utils.ts';
import { nanoid } from 'nanoid';
import type { Feature } from 'geojson';

type RangeValue = string | number | null;
export class Coverage<T extends Domain = Domain> extends Base<CRG<T>> {
  indices?: Record<string, number>;
  type: 'Coverage';
  id?: string | undefined;
  domain: InferDomainClass<T>;
  /**
   * An object containing properties not explicitly defined on the Coverage class
   */
  properties: Record<string, unknown>;
  domainType: T['domainType'];
  parameters: Map<string, Parameter>;
  parameterGroups: ParameterGroup[];
  ranges: Map<string, NdArray>;
  uuid: string;
  constructor(coverage: CRG<T> & { ranges: Record<string, Nd> }) {
    super();

    this.type = coverage.type;
    this.id = coverage.id;
    this.domain = getDomain<T>(coverage.domain);
    this.domainType = this.domain.domainType;
    this.ranges = new Map(
      Object.keys(coverage.ranges).map((id) => [
        id.toUpperCase(),
        new NdArray(coverage.ranges[id]),
      ]),
    );
    //@todo capitalize
    coverage.parameters = coverage.parameters || {};
    this.parameters = new Map(
      Object.keys(coverage.parameters).map((id) => [
        id,
        new Parameter(coverage.parameters![id], id),
      ]),
    );
    this.parameterGroups = coverage.parameterGroups?.map((e) => new ParameterGroup(e)) || [];
    this.properties = {};
    for (const key in coverage) {
      if (
        ['domain', 'id', 'ranges', 'parameters', 'parameterGroups', 'type', 'domainType'].includes(
          key,
        )
      )
        continue;
      this.properties[key] = coverage[key];
    }
    this.uuid = nanoid();
    this.indices = undefined;
  }

  static async resolve<T extends Domain>(
    coverage: CRG<T | string>,
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

    return { ...coverage, domainType: domain.domainType, domain, ranges };
  }
  static async load<T extends Domain = Domain>(
    coverage: CRG<T | string> | string,
  ): Promise<Coverage<T>> {
    if (typeof coverage === 'string') coverage = await load<CRG<T>>(coverage);

    return Coverage.resolve<T>(coverage).then((cov) => new Coverage(cov));
  }

  addParameter(id: string, value: CovParam | Parameter): this {
    const isExisting = this.parameters.get(id);
    if (isExisting) return this;
    if (!(value instanceof Parameter)) value = new Parameter(value, id);
    this.parameters.set(id, value);
    return this;
  }
  addParameterGroup(group: CovPGroup | ParameterGroup) {
    if (!(group instanceof ParameterGroup)) group = new ParameterGroup(group);
    this.parameterGroups.push(group);
    return this;
  }
  /**
   * Assumes that the domain contained has implemented the method
   */
  denormalize(): Omit<this, 'domain'> & {
    domain: WithoutRegularlySpacedAxis<InferDomainClass<T>>;
  } {
    this.domain.denormalize?.();
    //@ts-expect-error Type union manenos
    return this;
  }

  normalize(): this {
    this.domain.normalize?.();
    return this;
  }

  get feature(): Feature<
    InferDomainClass<T>['geometry'],
    { uuid: string; domainType: InferDomainClass<T>['domainType'] }
  > {
    return {
      type: 'Feature',
      geometry: this.domain.geometry,
      properties: {
        uuid: this.uuid,
        domainType: this.domainType, // Allow filtering for maplibregl
      },
      // id:this.uuid // If properties is null, then id becomes undefined in maplibre
    };
  }

  /**
   * Indicates whether this coverage satisfies the temporal or spatial conditions
   */

  queryIndices(point: Position) {
    return this.domain.queryIndices(point);
  }
  calculateIndices(point: Position): WithRequiredProperty<this, 'indices'> {
    this.indices = this.queryIndices(point);
    //@ts-expect-error explicit assignment does not seem to work
    return this;
  }
  toPlain(): CRG<T> {
    return structuredClone<CRG<T>>({
      type: this.type,
      domain: this.domain.toPlain() as T,
      ranges: this.ranges
        .keys()
        .reduce((l, r) => ({ ...l, [r]: this.ranges.get(r)!.toPlain() }), {}),
      domainType: this.domain.domainType,
      parameters: this.parameters
        .entries()
        .reduce((l, [id, val]) => ({ ...l, [id]: val.toPlain() }), {}),
      parameterGroups: this.parameterGroups.map((v) => v.toPlain()),
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
   * @todo allow 3D Positions so as to query z values
   * @example
   *  const data=await coverage.getData([0,0],["QC","POTM","x"])
   *  data==={"QC":50,"POTM":100,"x":undefined}
   */
  async getData(
    point: Position2D | Record<string, number>,
    rangeIds?: string[],
  ): Promise<Record<string, RangeValue | undefined>> {
    const indices = Array.isArray(point) ? this.queryIndices(point) : point;
    if (!rangeIds) rangeIds = this.ranges.keys().toArray();
    const data = await Promise.all(rangeIds.map((id) => this.ranges.get(id)?.get(indices)));
    return rangeIds.reduce((l, r, i) => ({ ...l, [r]: data[i] }), {});
  }
}
