import { BaseDomain } from './base-domain.ts';
import type { MultiPointSeries as MpsD, MultiPoint as MpD } from '../coveragejson.d.ts';
import { Referencing } from '../referencing.ts';
import type { MultiPoint as MultiPointGeometry } from 'geojson';
import { calcStrAxisBounds, calc2dTupleAxisBounds, calcNumAxisBounds } from './utils.ts';
import distance from '@turf/distance';
import { minMax } from '../utils.ts';
import { Point, PointSeries } from './point.ts';

abstract class Base<T extends MpD | MpsD> extends BaseDomain<T> {
	constructor(domain: T) {
		super(domain);
	}
	normalize = undefined;
	denormalize = undefined;
	queryIndices(point: [number, number]): Record<'composite', number> {
		const distances = this.axes.composite.values.map(([lon, lat]) => distance(point, [lon, lat]));
		const [minD] = minMax(distances);
		return {
			composite: minD === null ? 0 : distances.findIndex((dist) => minD === dist)!
		};
	}
	calculateAxesBounds(timeZone?: string): this {
		if (this.axes.t) this.axes.t.bounds = calcStrAxisBounds(this.axes.t.values, timeZone);
		const xyBounds = calc2dTupleAxisBounds(this.axes.composite.values);
		const zBounds = calcNumAxisBounds(
			this.axes.composite.values.map(([, , z]) => (z === undefined ? 0 : z))
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
	abstract split(compositeIndex: number): T extends MpD ? Point : PointSeries;
}

export class MultiPoint extends Base<MpD> {
	get geometry(): MultiPointGeometry {
		return {
			type: 'MultiPoint',
			coordinates: this.axes.composite.values
		};
	}
	split(compositeIndex: number): Point {
		const domain = this.toPlain();
		const [x, y, z] = domain.axes.composite.values[compositeIndex];
		return new Point({
			...domain,
			domainType: 'Point',
			axes: {
				x: { values: [x] },
				y: { values: [y] },
				z: z === undefined ? undefined : { values: [z] },
				t: domain.axes.t
			}
		});
	}

	constructor(domain: MpD) {
		super(domain);
	}
}
export class MultiPointSeries extends Base<MpsD> {
	get geometry(): MultiPointGeometry {
		return {
			type: 'MultiPoint',
			coordinates: this.axes.composite.values
		};
	}
	split(compositeIndex: number): PointSeries {
		const domain = this.toPlain();
		const [x, y, z] = domain.axes.composite.values[compositeIndex];
		return new PointSeries({
			...domain,
			domainType: 'PointSeries',
			axes: {
				x: { values: [x] },
				y: { values: [y] },
				z: z === undefined ? undefined : { values: [z] },
				t: domain.axes.t
			}
		});
	}
	queryIndices(point: [number, number]): Record<'composite', number> {
		const distances = this.axes.composite.values.map(([lon, lat]) => distance(point, [lon, lat]));
		const [minD] = minMax(distances);
		return {
			composite: minD === null ? 0 : distances.findIndex((dist) => minD === dist)!
		};
	}
	constructor(domain: MpsD) {
		super(domain);
	}
}
