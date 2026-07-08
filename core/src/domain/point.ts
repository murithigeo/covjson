import type { Point as PointGeometry } from 'geojson';
import type {
	Point as PointD,
	PointSeries as PSeriesD,
	Position2D,
	MultiPoint as MP,
	MultiPointSeries as MPSeries
} from '../coveragejson.d.ts';
import type { Referencing } from '../referencing.ts';
import { BaseDomain } from './base-domain.ts';
import { calcNumAxisBounds, calcStrAxisBounds } from './utils.ts';
import { MultiPoint } from './multipoint.ts';

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
	queryIndices(): Record<'x' | 'y', number> {
		return { x: 0, y: 0 };
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
	/**
	 * @todo determine what to do if there's no t/z values in incoming points
	 */
	collect(...points: PointD[] | Point[]): MultiPoint {
		const template = this.toPlain();
		const axes: MP['axes'] = {
			composite: {
				dataType: 'tuple',
				coordinates: ['x', 'y', 'z'],
				values: [[template.axes.x.values[0], template.axes.y.values[0], -1]]
			},
			t: template.axes.t
		};
		for (let i = 0; i < points.length; i++) {
			let val = points[i];
			val = 'toPlain' in val ? val.toPlain() : val;
			const { x, y, z, t } = val.axes;
			axes.composite.values[i + 1] = [x.values[0], y.values[0], z?.values[0] || -1];
			if (t) axes.t?.values.push(t?.values[0]);
		}
		return new MultiPoint({
			type: 'Domain',
			axes,
			referencing: template.referencing,
			domainType: 'MultiPoint'
		});
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
