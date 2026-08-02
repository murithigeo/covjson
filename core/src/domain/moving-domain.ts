import { BaseDomain } from './base-domain.ts';
import type { Trajectory as TrajDomain, Section as SectionDomain, Position } from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import type { LineString } from 'geojson';
import { denormalizeNumAxis, normalizeNumAxis, numAxisIsNormalized } from './utils.ts';
import { indexOfNearest, minMax } from '../utils.ts';
import distance from '@turf/distance';
import type { WithoutRegularlySpacedAxis } from './types.d.ts';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { set } from '@murithigeo/uriproj';
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
      if (z === undefined) continue;
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
}

export class Trajectory extends Base<TrajDomain> {
  queryIndices(point: Position): Map<'z' | 'composite', number> {
    const indices = new Map();
    const {
      properties: { segmentIndex: composite }
    } = nearestPointOnLine(this.geometry, point, { units: 'meters' });
    indices.set('composite', composite);
    indices.set('z', 0);
    if (point[2] !== undefined && this.axes.z?.values) {
      indices.set('z', indexOfNearest(this.axes.z.values, point[2]));
    }
    return indices;
  }
  get z(): number[] {
    const values = this.axes.composite.values.map(([, , , z]) => z).filter((v) => v !== undefined);
    if (this.axes.z) values.push(this.axes.z.values[0]);
    return values;
  }
  get geometry(): LineString {
    return {
      type: 'LineString',
      coordinates: this.axes.composite.values.map(([, x, y, z]) => {
        if (z === undefined) return [x, y];
        return [x, y, z];
      })
    };
  }
}

export class Section extends Base<SectionDomain> {
  queryIndices(point: Position): Map<'z' | 'composite', number> {
    const indices = new Map();
    const {
      properties: { segmentIndex: composite }
    } = nearestPointOnLine(this.geometry, point, { units: 'meters' });
    indices.set('composite', composite);
    if (point[2] === undefined) point[2] = 0;
    indices.set('z', indexOfNearest(denormalizeNumAxis(this.axes.z).values, point[2]));
    return indices;
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
