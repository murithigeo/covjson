import { BaseDomain, type SpatioTemporalPosition } from './base-domain.ts';
import type { Trajectory as TrajDomain, Section as SectionDomain, Position } from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import type { LineString } from 'geojson';
import { denormalizeNumAxis, isUndefined, normalizeNumAxis, numAxisIsNormalized } from './utils.ts';
import { indexOfNearest, minMax } from '../utils.ts';
import type { WithoutRegularlySpacedAxis } from './types.d.ts';
import nearestPointOnLine from '@turf/nearest-point-on-line';

/**
 * With a moving domain, we can find the indices using time or using a reference point
 */
abstract class Base<T extends TrajDomain | SectionDomain> extends BaseDomain<T> {
  calculateAxesBounds(): this {
    return this;
  }
  _reproject(referencing: Referencing): this {
    super._reproject(referencing);
    for (let i = 0; i < this.axes.composite.values.length; i++) {
      let [t, x, y, z] = this.axes.composite.values[i];
      t = referencing.trs(t);
      [x, y] = referencing.crs([x, y]);
      this.axes.composite.values[i] = [t, x, y];
      if (isUndefined(z)) continue;
      z = referencing.vrs(z);
      this.axes.composite.values[i][3] = z;
    }
    if (this.axes.z) {
      if (!numAxisIsNormalized(this.axes.z))
        this.axes.z.values = this.axes.z.values.map(referencing.vrs);
      else {
        [this.axes.z.start, this.axes.z.stop] = [this.axes.z.start, this.axes.z.stop].map((v) =>
          referencing.vrs(v)
        );
      }
    }
    return this;
  }
  normalize(): this {
    if (!this.axes.z) return this;
    this.axes.z = normalizeNumAxis(this.axes.z);
    return this;
  }
  denormalize(): WithoutRegularlySpacedAxis<this> {
    if (this.axes.z) this.axes.z = denormalizeNumAxis(this.axes.z);
    //@ts-expect-error WithoutRegularlySpacedAxis is not correctly extended
    return this;
  }
  get t(): string[] {
    return this.axes.composite.values.map(([t]) => t);
  }
  get axesStats(): Map<keyof T['axes'], number> {
    return new Map().set('composite', this.axes.composite.values.length).set('z', this.z.length);
  }
}

export class Trajectory extends Base<TrajDomain> {
  get axesCount(): Map<'z' | 'composite', number> {
    return new Map()
      .set('composite', this.axes.composite.values.length)
      .set('z', this.axes.z ? 1 : 0);
  }
  /**
   *
   * @param point We can also pass a time string instead because it can be easier
   * @returns
   */
  queryIndices(ref: Position | string | number): Map<'z' | 'composite', number> {
    const indices = new Map().set('composite', 0).set('z', 0);
    let composite = 0;
    if (typeof ref === 'string') composite = this.tIndex(ref);
    else if (typeof ref === 'number') composite = this.zIndex(ref);
    else {
      ({
        properties: { segmentIndex: composite }
      } = nearestPointOnLine(this.geometry, ref));
    }
    return indices.set('composite', composite);
  }
  get z(): number[] {
    return this.axes.composite.values.map(([, , , z]) => z).filter((v) => !isUndefined(v));
    // if (this.axes.z) values.push(this.axes.z.values[0]); // x is single value so ignore
  }
  get geometry(): LineString {
    return {
      type: 'LineString',
      coordinates: this.axes.composite.values.map(([, x, y, z]) => {
        if (isUndefined(z)) return [x, y];
        return [x, y, z];
      })
    };
  }
}

export class Section extends Base<SectionDomain> {
  get axesCount(): Map<'z' | 'composite', number> {
    return new Map().set('composite', this.axes.composite.values.length).set('z', this.z.length);
  }
  queryIndices(ref: Position | number | string): Map<'z' | 'composite', number> {
    const indices = new Map().set('composite', 0).set('z', 0);
    let composite = 0;

    let zRef = typeof ref === 'number' ? ref : undefined;
    if (Array.isArray(ref)) {
      ({
        properties: { segmentIndex: composite }
      } = nearestPointOnLine(this.geometry, ref));
      if (!isUndefined(ref[2])) [, , zRef] = ref;
    }
    if (typeof ref === 'string') composite = this.tIndex(ref);
    if (!isUndefined(zRef)) indices.set('z', this.zIndex(zRef));
    return indices.set('composite', composite);
  }

  get z(): number[] {
    return denormalizeNumAxis(this.axes.z).values;
  }
  get geometry(): LineString {
    return {
      type: 'LineString',
      coordinates: this.axes.composite.values.map(([, x, y]) => [x, y])
    };
  }
}
