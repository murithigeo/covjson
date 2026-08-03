import type { Point as PointGeometry } from 'geojson';
import type {
  Point as PointD,
  PointSeries as PSeriesD,
  Position2D,
  Position,
  VerticalProfile as VertProfDomain
} from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import { BaseDomain } from './base-domain.ts';
import {
  calcNumAxisBounds,
  calcStrAxisBounds,
  denormalizeNumAxis,
  isUndefined,
  normalizeNumAxis,
  numAxisIsNormalized
} from './utils.ts';
import type { WithoutRegularlySpacedAxis } from './types.d.ts';
import { indexOfNearest } from '../utils.ts';

abstract class PointBasedDomain<
  T extends PointD | PSeriesD | VertProfDomain
> extends BaseDomain<T> {
  constructor(domain: T) {
    super(domain);
  }
  _reproject(referencing: Referencing): this {
    super._reproject(referencing);
    [this.axes.x.values[0], this.axes.y.values[0]] = referencing.crs([
      this.axes.x.values[0],
      this.axes.y.values[0]
    ]);
    if (this.axes.z) {
      if (numAxisIsNormalized(this.axes.z)) {
      } else this.axes.z.values = this.axes.z.values.map((v) => referencing.vrs(v));
    }
    if (this.axes.t) this.axes.t.values = this.axes.t.values.map(referencing.trs.bind(referencing));
    return this;
  }
  get z(): number[] {
    if (!this.axes.z) return [];
    return denormalizeNumAxis(this.axes.z).values;
  }
  get t(): string[] {
    return this.axes.t?.values || [];
  }
  calculateAxesBounds(timeZone?: string): this {
    this.axes.x.bounds = calcNumAxisBounds(this.axes.x.values) as Position2D;
    this.axes.y.bounds = calcNumAxisBounds(this.axes.y.values) as Position2D;
    if (this.axes.z && !numAxisIsNormalized(this.axes.z)) {
      this.axes.z.bounds = calcNumAxisBounds(this.axes.z.values) as Position2D;
    }
    if (this.axes.t) this.axes.t.bounds = calcStrAxisBounds(this.axes.t.values, timeZone);
    return this;
  }
  queryIndices(point: Position) {
    const indices = new Map<keyof T['axes'], number>([
      ['x', 0],
      ['y', 0],
      ['z', 0],
      ['t', 0]
    ]);
    if (this.axes.z && !isUndefined(point[2])) {
      indices.set('z', indexOfNearest(denormalizeNumAxis(this.axes.z).values, point[2]));
    }
    return indices;
  }
  get axesStats(): Map<keyof T['axes'], number> {
    return new Map([
      ['x', 0],
      ['y', 0],
      ['t', this.t.length],
      ['z', this.z.length]
    ]);
  }
}

export class Point extends PointBasedDomain<PointD> {
  constructor(domain: PointD) {
    super(domain);
  }
  get geometry(): PointGeometry {
    return {
      type: 'Point',
      coordinates: [this.axes.x.values[0], this.axes.y.values[0]]
    };
  }
  normalize = undefined;
  denormalize = undefined;
}

export class PointSeries extends PointBasedDomain<PSeriesD> {
  normalize = undefined;
  denormalize = undefined;
  get geometry(): PointGeometry {
    return {
      type: 'Point',
      coordinates: [this.axes.x.values[0], this.axes.y.values[0]]
    };
  }
  queryIndices(point: Position): Map<'x' | 'y' | 'z' | 't', number> {
    return super.queryIndices(point);
  }
  constructor(domain: PSeriesD) {
    super(domain);
  }
}

export class VerticalProfile extends PointBasedDomain<VertProfDomain> {
  calculateAxesBounds(): this {
    if (!numAxisIsNormalized(this.axes.z)) {
      this.axes.z.bounds = calcNumAxisBounds(this.axes.z.values);
    }
    return this;
  }
  constructor(domain: VertProfDomain) {
    super(domain);
  }
  get geometry(): PointGeometry {
    return {
      type: 'Point',
      coordinates: [this.axes.x.values[0], this.axes.y.values[0]]
    };
  }
  get z(): number[] {
    return denormalizeNumAxis(this.axes.z).values;
  }
  get t(): string[] {
    return this.axes.t?.values || [];
  }
  _reproject(referencing: Referencing): this {
    super._reproject(referencing);

    [this.axes.x.values[0], this.axes.y.values[0]] = referencing.crs([
      this.axes.x.values[0],
      this.axes.y.values[0]
    ]);
    if ('values' in this.axes.z)
      this.axes.z.values = this.axes.z.values.map(referencing.vrs.bind(referencing));
    else {
      [this.axes.z.start, this.axes.z.stop] = [this.axes.z.start, this.axes.z.stop].map(
        referencing.vrs
      );
    }
    if (this.axes.t) this.axes.t.values[0] = referencing.trs(this.axes.t.values[0]);
    return this;
  }

  denormalize(): WithoutRegularlySpacedAxis<this> {
    this.axes.z = denormalizeNumAxis(this.axes.z);
    //@ts-expect-error WithoutRegularlySpacedAxis is not correctly extended
    return this;
  }

  normalize = () => {
    this.axes.z = normalizeNumAxis(this.axes.z);
    return this;
  };
  queryIndices(point: Position): Map<'x' | 'y' | 'z' | 't', number> {
    const indices = super.queryIndices(point);
    if (point[2] === undefined) point[2] = 0; // todo, set index to 0 instead
    indices.set('z', indexOfNearest(denormalizeNumAxis(this.axes.z).values, point[2]));
    return indices;
  }
  // todo split into point/multipoint
}
