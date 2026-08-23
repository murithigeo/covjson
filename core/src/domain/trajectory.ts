import { BaseDomain } from './base-domain.ts';
import type { Trajectory as TrajDomain, Position } from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import type { LineString } from 'geojson';
import { isUndefined } from './utils.ts';
import nearestPointOnLine from '@turf/nearest-point-on-line';

/**
 * With a moving domain, we can find the indices using time or using a reference point
 * Rework since we need to display both a line and points. Rename to trajectory since it only applies to it
 */
export class Trajectory extends BaseDomain<TrajDomain> {
  constructor(domain: TrajDomain) {
    super(domain);
  }
  normalize = undefined;
  denormalize = undefined;
  get axesSize(): Map<'z' | 'composite', number> {
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
    return indices;
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
    if (this.axes.z) this.axes.z.values[0] = referencing.vrs(this.axes.z.values[0]);
    return this;
  }

  get t(): string[] {
    return this.axes.composite.values.map(([t]) => t);
  }
}
