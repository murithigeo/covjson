import type {
  Domain,
  MultiPoint,
  MultiPointSeries,
  Point,
  PointSeries,
  Polygon,
  PolygonSeries,
  Section,
  VerticalProfile,
  Trajectory,
  ReferenceSystemConnection,
  Position
} from 'coveragejson';
import { Base } from '../base.ts';
import type { Referencing } from '../referencing.ts';
import type { WithoutRegularlySpacedAxis } from './types.d.ts';
import { indexOfNearest } from '../utils.ts';

export abstract class BaseDomain<D extends Domain = Domain> extends Base<D> {
  type: D['type'];
  domainType: D['domainType'];
  axes: D['axes'];
  #referencing: D['referencing'] | undefined;
  constructor(domain: D) {
    super();
    this.type = domain.type;
    this.domainType = domain.domainType;
    this.axes = domain.axes;
    this.#referencing = domain.referencing;
  }
  get referencing(): D['referencing'] {
    return this.#referencing;
  }
  /**
   * An unsorted list of t values in the domain's axes
   */
  abstract get t(): string[];
  /**
   * An unsorted list of z values in the domain's axes.
   * For some domains, it is cheaper to find the value's index here instead of looping through tuples
   */
  abstract get z(): number[];
  /**
   * Calculates and sets the "bounds" property of each axis in the domain
   * Will overwrite the property if value has been set
   * @todo remove mention in the types and make this an optional module because of the dependencies it requires
   * @param timeZone The offset or IANA TimeZone name to use for instants
   */
  abstract calculateAxesBounds(timeZone?: string): this;
  /**
   * Number of axis values in the domain
   */
  abstract get axesSize(): Map<keyof D['axes'], number>;
  /**
   * Note that this is a clone of the class's core deets
   */
  toPlain(useRefs = true): D {
    return structuredClone({
      type: this.type,
      domainType: this.domainType,
      axes: this.axes,
      referencing: useRefs ? this.referencing : undefined
    }) as D;
  }
  /**
   * If applicable, converts any "primitive" axis to @see {RegularlySpacedAxis}
   * Returns a new copy of the class
   */
  abstract normalize?(): this;
  /**
   * If applicable,converts any @see {RegularlySpacedAxis} to a primitive axis
   * Returns a new copy of the class
   */
  abstract denormalize?(): WithoutRegularlySpacedAxis<BaseDomain<D>>;
  /**
   * Get the geojson representation of the domain's "horizontal" values
   */
  abstract get geometry(): D extends Point | PointSeries | VerticalProfile
    ? GeoJSON.Point
    : D extends Trajectory
      ? GeoJSON.LineString
      : D extends Polygon | PolygonSeries
        ? GeoJSON.Polygon
        : D extends MultiPoint | MultiPointSeries | Section
          ? GeoJSON.MultiPoint
          : GeoJSON.MultiPolygon;
  _reproject(referencing: Referencing): this {
    this.referencing = referencing.connections;
    return this;
  }
  set referencing(referencing: ReferenceSystemConnection[] | undefined) {
    this.#referencing = referencing;
  }

  tIndex(t: string): number {
    return indexOfNearest(
      this.t.map((t) => new Date(t).getTime()),
      new Date(t).getTime()
    );
  }
  zIndex(z: number): number {
    return indexOfNearest(this.z, z);
  }
  abstract queryIndices(ref: Position | string | number): Map<keyof D['axes'], number>;
  /**
   * We can have a method that returns boolean for boolean intersects
   * Another for determining which composite values intersect ie. for polygons,multipoints which are computationally expensive
   */
  // intersects()
}
