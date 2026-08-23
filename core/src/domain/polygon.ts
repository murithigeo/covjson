import { BaseDomain } from './base-domain.ts';
import type {
  Polygon as PolygonDomain,
  PolygonSeries as PolySeriesD,
  MultiPolygon as MP,
  MultiPolygonSeries as MPs,
  Position
} from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import inside from 'point-in-polygon-hao';
import type { Polygon as PolygonGeometry } from 'geojson';
import { calcNumAxisBounds } from './utils.ts';

abstract class Base<T extends PolygonDomain | PolySeriesD | MP | MPs> extends BaseDomain<T> {
  constructor(domain: T) {
    super(domain);
  }
  get axesSize(): Map<keyof T['axes'], number> {
    return new Map()
      .set('composite', this.axes.composite.values.length)
      .set('t', this.t.length)
      .set('z', this.z.length);
  }
  _reproject(referencing: Referencing): this {
    super._reproject(referencing);
    for (let oi = 0; oi < this.axes.composite.values.length; oi++) {
      for (let ii = 0; ii < this.axes.composite.values[oi].length; ii++) {
        for (let i = 0; i < this.axes.composite.values[oi][ii].length; i++) {
          let pos = this.axes.composite.values[oi][ii][i];
          pos = referencing.crs(pos);
          this.axes.composite.values[oi][oi][i] = pos;
        }
      }
    }
    if (this.axes.z) this.axes.z.values[0] = referencing.vrs(this.axes.z.values[0]);
    if (this.axes.t) {
      for (let i = 0; i < this.axes.t.values.length; i++) {
        this.axes.t.values[i] = referencing.trs(this.axes.t.values[i]);
      }
    }
    return this;
  }

  get z(): number[] {
    return this.axes.z?.values || [];
  }
  get t(): string[] {
    return this.axes.t?.values || [];
  }
  queryIndices(ref: Position | number | string): Map<'composite' | 't', number> {
    const indices = new Map().set('composite', 0).set('t', 0).set('z', 0);
    if (Array.isArray(ref)) {
      for (let i = 0; i < this.axes.composite.values.length; i++) {
        if (inside(ref, this.axes.composite.values[i]) === false) continue;
        indices.set('composite', i);
        break;
      }
    }
    if (typeof ref === 'string') indices.set('t', this.tIndex(ref));
    return indices;
  }
  normalize = undefined;
  denormalize = undefined;
  calculateAxesBounds(): this {
    if (this.axes.z) this.axes.z.bounds = calcNumAxisBounds(this.axes.z.values);

    return this;
  }
}

export class Polygon extends Base<PolygonDomain> {
  calculateAxesBounds(): this {
    return this;
  }
  get geometry(): PolygonGeometry {
    return {
      type: 'Polygon',
      coordinates: this.axes.composite.values[0]
    };
  }
  constructor(domain: PolygonDomain) {
    super(domain);
  }
}

export class PolygonSeries extends Base<PolySeriesD> {
  calculateAxesBounds(): this {
    if (this.axes.z) {
      this.axes.z.bounds = calcNumAxisBounds(this.axes.z.values) as [number, number];
    }
    return this;
  }
  get geometry(): PolygonGeometry {
    return {
      type: 'Polygon',
      coordinates: this.axes.composite.values[0]
    };
  }
  constructor(domain: PolySeriesD) {
    super(domain);
  }
}

export class MultiPolygon extends Base<MP> {
  constructor(domain: MP) {
    super(domain);
  }

  get geometry(): GeoJSON.MultiPolygon {
    return {
      type: 'MultiPolygon',
      coordinates: this.axes.composite.values
    };
  }
}

export class MultiPolygonSeries extends Base<MPs> {
  constructor(domain: MPs) {
    super(domain);
  }

  get geometry(): GeoJSON.MultiPolygon {
    return {
      type: 'MultiPolygon',
      coordinates: this.axes.composite.values
    };
  }
}
