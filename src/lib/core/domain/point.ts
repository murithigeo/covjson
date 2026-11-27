import type { Point as PointGeometry } from 'geojson';
import type {
	Point as PointD,
	PointSeries as PSeriesD,
	Position,
	VerticalProfile as VertProfDomain,
	WithBounds
} from 'coveragejson';
import type { Referencing } from '../referencing.js';
import { BaseDomain } from './base-domain.js';
import { denormalizeNumAxis, isUndefined, normalizeNumAxis, numAxisIsNormalized } from './utils.js';

abstract class Base<D extends PointD | PSeriesD | VertProfDomain> extends BaseDomain<D> {
	_reproject(referencing: Referencing): this {
		[this.axes.x.values[0], this.axes.y.values[0]] = referencing.crs([
			this.axes.x.values[0],
			this.axes.y.values[0]
		]);
		if (this.axes.z) {
			if (numAxisIsNormalized(this.axes.z)) {
				this.axes.z.start = referencing.vrs(this.axes.z.start);
				this.axes.z.stop = referencing.vrs(this.axes.z.stop);
			} else this.axes.z.values = this.axes.z.values.map((v) => referencing.vrs(v));
		}
		if (this.axes.t) this.axes.t.values = this.axes.t.values.map(referencing.trs.bind(referencing));
		return this;
	}
	get z(): number[] {
		if (!this.axes.z) return [];
		return denormalizeNumAxis(this.axes.z).values;
	}
	get t() {
		if (!this.axes.t) return [];
		return this.axes.t.values.map((v) => v);
	}

	queryIndices(ref: Position | string | number): Map<keyof D['axes'], number> {
		const indices = new Map().set('x', 0).set('y', 0).set('z', 0).set('t', 0);
		const zRef = typeof ref === 'number' ? ref : Array.isArray(ref) ? ref[2] : undefined;
		if (!isUndefined(zRef)) indices.set('z', this.zIndex(zRef));
		if (typeof ref === 'string') indices.set('t', this.tIndex(ref));
		return indices;
	}
	get axesSize(): Map<keyof D['axes'], number> {
		return new Map().set('x', 1).set('y', 1).set('t', this.t.length).set('z', this.z.length);
	}
}

export class Point extends Base<PointD> {
	denormalize(): this {
		return this;
	}

	get geometry(): PointGeometry {
		return {
			type: 'Point',
			coordinates: [this.axes.x.values[0], this.axes.y.values[0]]
		};
	}
}

export class PointSeries extends Base<PSeriesD> {
	denormalize(): this {
		return this;
	}
	get geometry(): PointGeometry {
		return {
			type: 'Point',
			coordinates: [this.axes.x.values[0], this.axes.y.values[0]]
		};
	}
}

export class VerticalProfile extends Base<VertProfDomain> {
	get geometry(): PointGeometry {
		return {
			type: 'Point',
			coordinates: [this.axes.x.values[0], this.axes.y.values[0]]
		};
	}

	_reproject(referencing: Referencing): this {
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

	denormalize(): Omit<this, 'axes'> & {
		axes: {
			x: { values: [number] } & WithBounds<[number, number]>;
			y: { values: [number] } & WithBounds<[number, number]>;
			z: { values: number[] } & WithBounds<number[]>;
			t?: ({ values: [string] } & WithBounds<[string, string]>) | undefined;
		};
	} {
		{
			this.axes.z = denormalizeNumAxis(this.axes.z);
			//@ts-expect-error compat issue
			return this;
		}
	}

	normalize() {
		this.axes.z = normalizeNumAxis(this.axes.z);
		return this;
	}
}
