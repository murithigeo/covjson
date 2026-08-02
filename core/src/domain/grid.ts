import type { BBox, Feature, MultiPolygon, Polygon } from 'geojson';
import type { Grid as GridDomain, Position } from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import { BaseDomain } from './base-domain.ts';
import combine from '@turf/combine';
import {
  denormalizeNumAxis,
  normalizeNumAxis,
  numAxisIsNormalized,
  calcNumAxisBounds,
  calcStrAxisBounds
} from './utils.ts';
import bboxPolygon from '@turf/bbox-polygon';
import type { WithoutRegularlySpacedAxis } from './types.d.ts';
import { indexOfNearest } from '../utils.ts';

export class Grid extends BaseDomain<GridDomain> {
  /**
   * Normalize axes individually
   */
  #normalize(axisName: 'x' | 'y' | 'z') {
    if (!this.axes[axisName]) return;
    this.axes[axisName] = normalizeNumAxis(this.axes[axisName]);
  }

  _reproject(referencing: Referencing): this {
    super._reproject(referencing);
    const [xvals, yvals] = [this.x, this.y];
    const xIsNormalized = numAxisIsNormalized(this.axes.x);
    const yIsNormalized = numAxisIsNormalized(this.axes.y);

    this.axes.x = { values: [] };
    this.axes.y = { values: [] };

    for (let i = 0; i < Math.max(xvals.length, yvals.length); i++) {
      const [x, y] = [xvals[i], yvals[i]];
      if (x !== undefined && y !== undefined) {
        [this.axes.x.values[i], this.axes.y.values[i]] = referencing.crs([x, y]);
        continue;
      }

      // Get the last values
      if (x === undefined) {
        this.axes.y.values[i] = referencing.crs([xvals[xvals.length - 1], y])[1];
        continue;
      }
      if (y === undefined) {
        [this.axes.x.values[i]] = referencing.crs([x, yvals[yvals.length - 1]]);
      }
    }
    if (xIsNormalized) this.#normalize('x');
    if (yIsNormalized) this.#normalize('y');

    if (this.axes.z) {
      if (numAxisIsNormalized(this.axes.z)) {
        [this.axes.z.start, this.axes.z.stop] = [this.axes.z.start, this.axes.z.stop].map((v) =>
          referencing.vrs(v)
        );
      } else {
        this.axes.z.values = this.axes.z.values.map((v) => referencing.vrs(v));
      }
    }
    if (this.axes.t) this.axes.t.values = this.axes.t.values.map((v) => referencing.trs(v));

    return this;
  }

  get t(): string[] {
    return this.axes.t?.values || [];
  }
  get z(): number[] {
    if (!this.axes.z) return [];
    return denormalizeNumAxis(this.axes.z).values;
  }
  calculateAxesBounds(timeZone?: string) {
    if ('values' in this.axes.x) this.axes.x.bounds = calcNumAxisBounds(this.axes.x.values);
    if ('values' in this.axes.y) this.axes.y.bounds = calcNumAxisBounds(this.axes.y.values);
    if (this.axes.z && 'values' in this.axes.z) {
      this.axes.z.bounds = calcNumAxisBounds(this.axes.z.values);
    }
    if (this.axes.t) this.axes.t.bounds = calcStrAxisBounds(this.axes.t.values, timeZone);
    return this;
  }
  normalize() {
    this.#normalize('x');
    this.#normalize('y');
    this.#normalize('z');
    return this;
  }
  denormalize(): WithoutRegularlySpacedAxis<this> {
    this.axes.x = denormalizeNumAxis(this.axes.x);
    this.axes.y = denormalizeNumAxis(this.axes.y);
    if (this.axes.z) this.axes.z = denormalizeNumAxis(this.axes.z);
    //@ts-expect-error WithoutRegularlySpacedAxis is not correctly extended
    return this;
  }
  get geometry(): MultiPolygon {
    const {
      features: [feature]
    } = combine({ type: 'FeatureCollection', features: this.polygons });
    return feature.geometry as MultiPolygon;
  }
  get x() {
    return denormalizeNumAxis(this.axes.x).values;
  }
  get y() {
    return denormalizeNumAxis(this.axes.y).values;
  }

  /**
   * @todo consider the cell values as the midpoints instead of edges
   */
  get bboxes(): BBox[] {
    const [xvals, yvals] = [this.x, this.y];
    const xBounds = calcNumAxisBounds(xvals);
    const yBounds = calcNumAxisBounds(yvals);
    const bboxes: BBox[] = [];
    // Directly loops over the dimensions—perfect for grid calculations
    for (let x = 0; x < xvals.length; x++) {
      const xMin = xBounds[2 * x];
      const xMax = xBounds[2 * x + 1];

      for (let y = 0; y < yvals.length; y++) {
        const yMin = yBounds[2 * y];
        const yMax = yBounds[2 * y + 1];

        bboxes.push([xMin, yMin, xMax, yMax]);
      }
    }
    return bboxes;
  }
  getPolygonAtIndices(xIndex = 0, yIndex = 0) {
    const xBounds = calcNumAxisBounds(this.x);
    const yBounds = calcNumAxisBounds(this.y);

    const [xmin, xmax] = [xBounds[2 * xIndex], xBounds[2 * xIndex + 1]];
    const [ymin, ymax] = [yBounds[2 * yIndex], yBounds[2 * yIndex + 1]];
    return bboxPolygon([xmin, ymin, xmax, ymax]).geometry;
  }
  get polygons(): Feature<Polygon>[] {
    return this.bboxes.map((bbox) => bboxPolygon(bbox));
  }
  queryIndices(point: Position): Map<'x' | 'y' | 'z' | 't', number> {
    const indices = new Map();
    indices.set('x', indexOfNearest(this.x, point[0]));
    indices.set('y', indexOfNearest(this.y, point[1]));
    let z = 0;
    if (this.axes.z && point[2] !== undefined) {
      z = indexOfNearest(denormalizeNumAxis(this.axes.z).values, point[2]);
    }
    indices.set('z', z);
    // todo add check for end of polygon
    // add inside check to find the exact indices
    return indices;
  }
  // split(xIndex: number, yIndex: number): PolygonSeries | Polygon | MultiPolygon | MultiPolygonSeries{

  // }
}
