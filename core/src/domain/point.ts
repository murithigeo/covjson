import type { Point as PointGeometry } from 'geojson';
import type { Point as PointD, PointSeries as PSeriesD, Position2D } from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import { BaseDomain } from './base-domain.ts';
import { calcNumAxisBounds, calcStrAxisBounds } from './utils.ts';

abstract class PointBasedDomain<T extends PointD | PSeriesD> extends BaseDomain<T> {
  constructor(domain: T) {
    super(domain);
  }
  _reproject(referencing: Referencing): this {
    super._reproject(referencing);
    [this.axes.x.values[0], this.axes.y.values[0]] = referencing.crs([
      this.axes.x.values[0],
      this.axes.y.values[0]
    ]);
    if (this.axes.z) this.axes.z.values[0] = referencing.vrs(this.axes.z.values[0]);
    if (this.axes.t) this.axes.t.values = this.axes.t.values.map(referencing.trs.bind(referencing));
    return this;
  }
  get z(): number[] {
    return this.axes.z?.values || [];
  }
  get t(): string[] {
    return this.axes.t?.values || [];
  }
  calculateAxesBounds(timeZone?: string): this {
    this.axes.x.bounds = calcNumAxisBounds(this.axes.x.values) as Position2D;
    this.axes.y.bounds = calcNumAxisBounds(this.axes.y.values) as Position2D;
    if (this.axes.z) this.axes.z.bounds = calcNumAxisBounds(this.axes.z.values) as Position2D;
    if (this.axes.t) this.axes.t.bounds = calcStrAxisBounds(this.axes.t.values, timeZone);
    return this;
  }
  queryIndices(): Map<'x' | 'y' | 't' | 'z', number> {
    return new Map([
      ['x', 0],
      ['y', 0],
      ['z', 0],
      ['t', 0]
    ]);
  }
  normalize = undefined;
  denormalize = undefined;
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
}

export class PointSeries extends PointBasedDomain<PSeriesD> {
  get geometry(): PointGeometry {
    return {
      type: 'Point',
      coordinates: [this.axes.x.values[0], this.axes.y.values[0]]
    };
  }
  constructor(domain: PSeriesD) {
    super(domain);
  }
}
