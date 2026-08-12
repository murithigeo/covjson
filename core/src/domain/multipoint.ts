import { BaseDomain, type SpatioTemporalPosition } from './base-domain.ts';
import type { MultiPointSeries as MpsD, MultiPoint as MpD, Position } from 'coveragejson';
import { Referencing } from '../referencing.ts';
import type { MultiPoint as MultiPointGeometry } from 'geojson';
import {
  calcStrAxisBounds,
  calc2dTupleAxisBounds,
  calcNumAxisBounds,
  isUndefined
} from './utils.ts';
import nearestPointOnLine from '@turf/nearest-point-on-line';

abstract class Base<T extends MpD | MpsD> extends BaseDomain<T> {
  constructor(domain: T) {
    super(domain);
  }
  normalize = undefined;
  denormalize = undefined;

  calculateAxesBounds(timeZone?: string): this {
    if (this.axes.t) this.axes.t.bounds = calcStrAxisBounds(this.axes.t.values, timeZone);
    const xyBounds = calc2dTupleAxisBounds(this.axes.composite.values);
    const zBounds = calcNumAxisBounds(
      this.axes.composite.values.map(([, , z]) => (isUndefined(z) ? 0 : z))
    );
    this.axes.composite.bounds = [];
    for (let i = 0; i < this.axes.composite.values.length; i++) {
      const lower = xyBounds[2 * i];
      const upper = xyBounds[2 * i + 1];
      if (this.axes.composite.values[i][2] !== undefined) {
        lower[2] = zBounds[2 * i];
        upper[2] = zBounds[2 * i + 1];
      }
      //@ts-expect-error 2D Pos/3D Pos Error
      this.axes.composite.bounds.push(lower, upper);
    }
    return this;
  }
  get z(): number[] {
    return this.axes.composite.values.map(([, , z]) => z).filter((v) => v !== undefined);
  }
  get t(): string[] {
    return this.axes.t?.values || [];
  }
  get axesCount(): Map<keyof T['axes'], number> {
    return new Map().set('composite', this.axes.composite.values.length).set('t', this.t.length);
  }
  _reproject(referencing: Referencing): this {
    super._reproject(referencing);
    for (let i = 0; i < this.axes.composite.values.length; i++) {
      let [x, y, z] = this.axes.composite.values[i];
      [x, y] = referencing.crs([x, y]);
      this.axes.composite.values[i] = [x, y];

      if (z !== undefined) {
        z = referencing.vrs(z);
        this.axes.composite.values[i][2] = z;
      }
    }

    if (this.axes.t) this.axes.t.values = this.axes.t.values.map(referencing.trs);
    return this;
  }
  queryIndices(ref: Position | string | number): Map<keyof T['axes'], number> {
    const indices = new Map().set('composite', 0).set('z', 0);

    let composite = 0;
    let zRef = typeof ref === 'number' ? ref : undefined;
    if (Array.isArray(ref)) {
      ({
        properties: { segmentIndex: composite }
      } = nearestPointOnLine({ ...this.geometry, type: 'LineString' }, ref));
      [, , zRef] = ref;
    }

    if (typeof ref === 'string') composite = this.tIndex(ref);
    if (!isUndefined(zRef)) indices.set('z', this.zIndex(zRef));
    return indices.set('composite', composite);
  }
}

export class MultiPoint extends Base<MpD> {
  get geometry(): MultiPointGeometry {
    return {
      type: 'MultiPoint',
      coordinates: this.axes.composite.values
    };
  }
}

export class MultiPointSeries extends Base<MpsD> {
  get geometry(): MultiPointGeometry {
    return {
      type: 'MultiPoint',
      coordinates: this.axes.composite.values
    };
  }

  constructor(domain: MpsD) {
    super(domain);
  }
}
