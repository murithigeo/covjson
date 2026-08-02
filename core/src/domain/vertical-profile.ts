import { BaseDomain } from './base-domain.ts';
import type { Position, VerticalProfile as VertProfDomain } from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import type { Point } from 'geojson';
import {
  calcNumAxisBounds,
  denormalizeNumAxis,
  normalizeNumAxis,
  numAxisIsNormalized
} from './utils.ts';
import type { WithoutRegularlySpacedAxis } from './types.js';
import { indexOfNearest } from '../utils.ts';

export class VerticalProfile extends BaseDomain<VertProfDomain> {
  calculateAxesBounds(): this {
    if (!numAxisIsNormalized(this.axes.z)) {
      this.axes.z.bounds = calcNumAxisBounds(this.axes.z.values);
    }
    return this;
  }
  constructor(domain: VertProfDomain) {
    super(domain);
  }
  get geometry(): Point {
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
    const indices = new Map();
    Object.keys(this.axes).forEach((axisName) => indices.set(axisName, 0));
    if (point[2] === undefined) point[2] = 0; // todo, set index to 0 instead

    indices.set('z', indexOfNearest(denormalizeNumAxis(this.axes.z).values, point[2]));
    return indices;
  }
  // todo split into point/multipoint
}
