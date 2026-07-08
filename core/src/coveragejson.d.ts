/**
 * CoverageJSON is a JSON encoding for representing and publishing spatio-temporal data on the web
 * http://www.opengis.net/doc/CS/covjson/1.0
 */
export as namespace CoverageJSON;
export type CoverageJSON = Domain | Coverage | CoverageCollection | NdArray;
/**
 * Common Domain
 */
export type Domain =
  | Grid
  | VerticalProfile
  | Point
  | PointSeries
  | MultiPoint
  | MultiPointSeries
  | Polygon
  | PolygonSeries
  | MultiPolygon
  | MultiPolygonSeries
  | Section
  | Trajectory;
/**
 * Common 'domainType' identifiers
 */
export type DomainTypes = Domain["domainType"];

/**
 * An object whose keys are valid BCP47 language tags and the values are strings in that language
 */
export type I18N = Record<string, string>;

/**
 * Valid values of a key in any CoverageJSON object
 * undefined is to ensure compatibility
 */
export type PrimitiveValue =
  | string
  | number
  | boolean
  | null
  | object
  | undefined;
export type Value = PrimitiveValue | Array<PrimitiveValue>;
/**
 * Represents metadata about the values in a CoverageJSON document in terms of the 'observedProperty'
 */
export interface Parameter {
  type: "Parameter";
  /**
   * A common identifier for the collection
   */
  id?: string;
  /**
   * SHOULD be omitted if identical to the "observedProperty" label
   */
  label?: I18N;
  description?: I18N;
  observedProperty: ObservedProperty;
  /**
   * MUST NOT be defined if "observedProperty" has a "categories" key
   */
  unit?: Unit;
  /**
   *
   */
  categoryEncoding?: CategoryEncoding;
}

export interface ObservedProperty {
  /**
   * A common ID for the ObservedProperty
   */
  id?: string;
  label: I18N;
  description?: I18N;
  categories?: [Category, ...Category[]];
}

export interface Category {
  id: string;
  label: I18N;
  description?: I18N;
}

/**
 * Describes categorical values such as Landcover classes and their values
 */
export type CategoryEncoding = Record<string, number | number[]>;

/**
 *
 */
export type Unit = { id?: string } & (
  | { label: I18N }
  | { label: I18N; symbol: UnitSymbol }
  | { symbol: UnitSymbol }
);

export type UnitSymbol =
  | string
  | { value: string; type: "http://www.opengis.net/def/uom/UCUM" | string };

export type ParameterGroup = {
  type: "ParameterGroup";
  /**
   * Common ID for the Parameter Group
   */
  id?: string;
  description?: I18N;
  /**
   * List of Parameter ID's that belong in this group
   */
  members: [string, ...string[]];
} & (
  | { label: I18N }
  | { label: I18N; observedProperty: ObservedProperty }
  | { observedProperty: ObservedProperty }
);

export type ReferenceSystemObject =
  | SpatialReferenceSystem
  | IdentifierBasedReferenceSystem
  | TemporalReferenceSystem;

export interface SpatialReferenceSystem {
  /**
   * Allows custom value
   */
  type: "GeographicCRS" | "ProjectedCRS" | "VerticalCRS";
  /**
   * A common ID for the System and should be omitted if unclear
   * If omitted, the "type" indicates the nature of the CRS
   */
  id?: string;
  /**
   * No standardized info is interpreted from this value
   */
  description?: I18N;
  [key: string]: Value;
}

export interface TemporalReferenceSystem {
  type: "TemporalRS";
  calendar: "Gregorian" | string;
  /**
   * Value MUST be an URI or "UTC".
   * If value is "UTC", then this member MUST be omitted
   */
  timeScale?: string | "UTC";
  [key: string]: Value;
}

export interface IdentifierBasedReferenceSystem {
  type: "IdentifierRS";
  id?: string;
  label?: I18N;
  targetConcept?: TargetConcept;
  identifiers?: Record<string, TargetConcept>;
  [key: string]: Value;
}

export interface ReferenceSystemConnection<
  RS extends ReferenceSystemObject = ReferenceSystemObject,
> {
  /**
   * An array of coordinate IDs that
   */
  coordinates: string[];
  system: RS;
}

export interface TargetConcept {
  label: I18N;
  description?: I18N;
  id?: string;
}

/**
 * An axis where values are strictly monotonic and the interval (step) between values is constant.
 * Can be converted back to a list in the interval `[0, num-1]` using the format `start + i *step` where `i` is the i-th element and `step = (stop- start) / (num - 1)`
 * If `num===0`, then `start=stop`
 * If `start>stop`, then the axis values are monotonically decreasing
 */
export interface RegularlySpacedAxis {
  start: number;
  stop: number;
  num: number;
}

export interface NdArrayObject {
  type: "NdArray" | "TiledNdArray";
  shape?: number[];
  axisNames?: string[];
  dataType: "string" | "integer" | "float";
}
export interface ValuesNdArray<
  T extends string | number,
> extends NdArrayObject {
  dataType: T extends string ? "string" : "integer" | "float";
  values: [T | null, ...(T | null)[]];
}
export type NumberNdArray = ValuesNdArray<number>;
export type StringNdArray = ValuesNdArray<string>;
export type NdArray = NumberNdArray | StringNdArray | TiledNdArray;

export interface TiledNdArray extends NdArrayObject {
  type: "TiledNdArray";
  axisNames: string[];
  shape: [number, ...number[]];
  tileSets: [TileSet, ...TileSet[]];
}

export interface TileSet {
  tileShape: (number | null)[];
  urlTemplate: string;
}

export interface Coverage<D extends Domain | string = Domain | string> {
  type: "Coverage";
  /**
   * Common ID for the Coverage
   */
  id?: string;
  /**
   * If value is string, then it must be an URL
   */
  domain: D;
  domainType?: Nullable<D extends Domain ? D["domainType"] : DomainTypes>;
  parameters?: Record<string, Parameter>;
  parameterGroups?: ParameterGroup[];
  ranges: Ranges;
  [key: string]: Value;
}

export interface Ranges {
  [key: string]: string | NdArray;
}
export interface CoverageCollection<
  D extends Domain | string = Domain | string,
> {
  type: "CoverageCollection";
  domainType?: Nullable<D extends Domain ? D["domainType"] : DomainTypes>;
  coverages: Coverage<D>[];
  parameters?: Record<string, Parameter>;
  parameterGroups?: ParameterGroup[];
  referencing?: ReferenceSystemConnection[];
}
export interface DomainObject {
  type: "Domain";
  domainType?: DomainTypes;
  axes: Domain["axes"];
  referencing?: ReferenceSystemConnection[];
}
export interface Grid extends DomainObject {
  domainType?: "Grid";
  axes: {
    x:
      | {
          values: number[];
          bounds?: number[];
        }
      | RegularlySpacedAxis;
    y:
      | {
          values: number[];
          bounds?: number[];
        }
      | RegularlySpacedAxis;
    z?:
      | {
          values: number[];
          bounds?: number[];
        }
      | RegularlySpacedAxis;
    t?: {
      values: string[];
      bounds?: string[];
    };
  };
}

export interface VerticalProfile extends DomainObject {
  domainType?: "VerticalProfile";
  axes: {
    x: {
      values: [number];
      bounds?: [number, number];
    };
    y: {
      values: [number];
      bounds?: [number, number];
    };
    z: { values: number[]; bounds?: number[] } | RegularlySpacedAxis;
    t?: { values: [string]; bounds?: [string, string] };
  };
}

export interface Point extends DomainObject {
  domainType?: "Point";
  axes: {
    x: { values: [number]; bounds?: [number, number] };
    y: { values: [number]; bounds?: [number, number] };
    z?: { values: [number]; bounds?: [number, number] };
    t?: { values: [string]; bounds?: [string, string] };
  };
}
export interface PointSeries extends Point {
  domainType?: "PointSeries";
  axes: Omit<Point["axes"], "t"> & {
    t: { values: string[]; bounds?: string[] };
  };
}

export type Position2D = [number, number];
export type Position3D = [number, number, number];
export type Position = Position2D | Position3D;

export interface MultiPoint extends DomainObject {
  domainType?: "MultiPoint";
  axes: {
    composite: { dataType: "tuple" } & (
      | { coordinates: ["x", "y"]; values: Position2D[]; bounds?: Position2D[] }
      | {
          coordinates: ["x", "y", "z"];
          values: Position3D[];
          bounds?: Position3D[];
        }
    );
    t?: { values: [string]; bounds?: [string, string] };
  };
}

export interface MultiPointSeries extends MultiPoint {
  domainType?: "MultiPointSeries";
  axes: Omit<MultiPoint["axes"], "t"> & {
    t: { values: string[]; bounds?: string[] };
  };
}

export interface Section extends DomainObject {
  domainType?: "Section";
  axes: {
    composite: {
      dataType: "tuple";
      coordinates: ["t", "x", "y"];
      values: [string, ...Position2D][];
      bounds?: [string, ...Position2D][];
    };
    z: { values: number[]; bounds?: number[] } | RegularlySpacedAxis;
  };
}

export interface Trajectory extends DomainObject {
  domainType: "Trajectory";
  axes: {
    composite:
      | Section["axes"]["composite"]
      | {
          dataType: "tuple";
          coordinates: ["t", "x", "y", "z"];
          values: [string, ...Position3D][];
          bounds?: [string, ...Position3D][];
        };
    z?: { values: [number]; bounds?: number[] };
  };
}

export interface Polygon extends DomainObject {
  domainType?: "Polygon";
  axes: {
    composite: {
      dataType: "polygon";
      coordinates: ["x", "y"];
      values: [Position2D[][]];
      bounds?: [Position2D[][], Position2D[][]];
    };
    z?: { values: [number]; bounds?: [number, number] };
    t?: { values: [string]; bounds?: [string, string] };
  };
}

export interface PolygonSeries extends Polygon {
  domainType?: "PolygonSeries";
  axes: Omit<Polygon["axes"], "t"> & {
    t: { values: string[]; bounds?: string[] };
  };
}

export interface MultiPolygon extends Polygon {
  domainType?: "MultiPolygon";
  axes: Omit<Polygon["axes"], "composite"> & {
    composite: Omit<Polygon["axes"]["composite"], "values"> & {
      values: Position2D[][][];
    };
  };
}

export interface MultiPolygonSeries extends MultiPolygon {
  domainType?: "MultiPolygonSeries";
  axes: Omit<MultiPolygon["axes"], "t"> & {
    t: { values: string[]; bounds?: string[] };
  };
}
