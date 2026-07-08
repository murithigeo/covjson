import type { BBox, Feature, MultiPolygon, Polygon } from 'geojson';
import type {  Grid as GridDomain } from '../coveragejson.d.ts';
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
import { indicesOfNearest } from '../utils.ts';

export class Grid extends BaseDomain<GridDomain> {
	constructor(domain: GridDomain) {
		super(domain);
	}

	/**
	 * Normalize axes individually
	 */
	#normalize(axisName: 'x' | 'y' | 'z') {
		if (!this.axes[axisName]) return;
		this.axes[axisName] = normalizeNumAxis(this.axes[axisName]);
	}

	_reproject(referencing: Referencing): this {
		super._reproject(referencing);
		const [xvals, yvals] = [this.#xvals, this.#yvals];
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
				[, this.axes.y.values[i]] = referencing.crs([xvals.at(-1)!, y]);
				continue;
			}
			if (y === undefined) {
				[this.axes.x.values[i]] = referencing.crs([x, yvals.at(-1)!]);
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
		this.axes.x = normalizeNumAxis(this.axes.x);
		this.axes.y = normalizeNumAxis(this.axes.y);
		if (this.axes.z) this.axes.z = normalizeNumAxis(this.axes.z);
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
	get #xvals() {
		return denormalizeNumAxis(this.axes.x).values;
	}
	get #yvals() {
		return denormalizeNumAxis(this.axes.y).values;
	}

	/**
	 * @todo consider the cell values as the midpoints instead of edges
	 */
	get bboxes(): BBox[] {
		const [xvals, yvals] = [this.#xvals, this.#yvals];
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
	get polygons(): Feature<Polygon>[] {
		return this.bboxes.map((bbox) => bboxPolygon(bbox));
	}
	queryIndices(point: [number, number]): Record<'x' | 'y', number> {
		const xstats = indicesOfNearest(this.#xvals, point[0]);
		const ystats = indicesOfNearest(this.#yvals, point[1]);
		const [x, y] = [xstats[0], ystats[0]];
		// todo add check for end of polygon
		// add inside check to find the exact indices
		return { x, y };
	}
	// split(xIndex: number, yIndex: number): PolygonSeries | Polygon | MultiPolygon | MultiPolygonSeries{

	// }
}
