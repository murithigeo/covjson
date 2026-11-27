import { BaseDomain } from './base-domain.js';
import type {
	MultiPointSeries as MpsD,
	MultiPoint as MpD,
	Position,
	Section as SectionDomain,
	Position2D,
	WithBounds
} from 'coveragejson';
import { Referencing } from '../referencing.js';
import type { MultiPoint as MultiPointGeometry } from 'geojson';
import { isUndefined, denormalizeNumAxis } from './utils.js';
import nearestPointOnLine from '@turf/nearest-point-on-line';

abstract class Base<T extends MpD | MpsD> extends BaseDomain<T> {
	get z(): number[] {
		return this.axes.composite.values.map(([, , z]) => z).filter((v) => v !== undefined);
	}
	get t() {
		if (!this.axes.t) return [];
		return this.axes.t.values.map((v) => v);
	}
	get axesSize(): Map<keyof T['axes'], number> {
		return new Map().set('composite', this.axes.composite.values.length).set('t', this.t.length);
	}
	_reproject(referencing: Referencing): this {
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
		const indices = new Map().set('composite', 0).set('t', 0);

		let composite = 0;
		let zRef = typeof ref === 'number' ? ref : undefined;
		if (Array.isArray(ref)) {
			({
				properties: { segmentIndex: composite }
			} = nearestPointOnLine({ ...this.geometry, type: 'LineString' }, ref));
			[, , zRef] = ref;
		}
		if (!isUndefined(zRef)) composite = this.zIndex(zRef);
		if (typeof ref === 'string') composite = this.tIndex(ref);
		return indices.set('composite', composite);
	}
}

export class MultiPoint extends Base<MpD> {
	denormalize(): this {
		return this;
	}
	get geometry(): MultiPointGeometry {
		return {
			type: 'MultiPoint',
			coordinates: this.axes.composite.values
		};
	}
}

export class MultiPointSeries extends Base<MpsD> {
	denormalize(): this {
		return this;
	}
	get geometry(): MultiPointGeometry {
		return {
			type: 'MultiPoint',
			coordinates: this.axes.composite.values
		};
	}
}

export class Section extends BaseDomain<SectionDomain> {
	get t() {
		return this.axes.composite.values.map(([t]) => t);
	}

	denormalize(): Omit<this, 'axes'> & {
		axes: {
			composite: {
				dataType: 'tuple';
				coordinates: ['t', 'x', 'y'];
				values: [string, ...Position2D][];
				bounds?: [string, ...Position2D][];
			};
			z: { values: number[] } & WithBounds<number[]>;
		};
	} {
		this.axes.z = denormalizeNumAxis(this.axes.z);
		//@ts-expect-error compat issue
		return this;
	}
	get axesSize(): Map<'z' | 'composite', number> {
		return new Map().set('composite', this.axes.composite.values.length).set('z', this.z.length);
	}
	queryIndices(ref: Position | number | string): Map<'z' | 'composite', number> {
		const indices = new Map().set('composite', 0).set('z', 0);
		let composite = 0;

		let zRef = typeof ref === 'number' ? ref : undefined;
		if (Array.isArray(ref)) {
			({
				properties: { segmentIndex: composite }
			} = nearestPointOnLine({ ...this.geometry, type: 'LineString' }, ref));
			if (!isUndefined(ref[2])) [, , zRef] = ref;
		}
		if (typeof ref === 'string') composite = this.tIndex(ref);
		if (!isUndefined(zRef)) indices.set('z', this.zIndex(zRef));
		return indices.set('composite', composite);
	}

	get z(): number[] {
		return denormalizeNumAxis(this.axes.z).values;
	}
	get geometry(): MultiPointGeometry {
		return {
			type: 'MultiPoint',
			coordinates: this.axes.composite.values.map(([, x, y]) => [x, y])
		};
	}
	_reproject(referencing: Referencing): this | Promise<this> {
		for (let i = 0; i < this.axes.composite.values.length; i++) {
			const [t, x, y] = this.axes.composite.values[i];
			this.axes.composite.values[i] = [referencing.trs(t), ...referencing.crs([x, y])];
		}
		if ('values' in this.axes.z) {
			this.axes.z.values = this.axes.z.values.map((v) => referencing.vrs(v));
		} else {
			[this.axes.z.start, this.axes.z.stop] = [this.axes.z.start, this.axes.z.stop].map((v) =>
				referencing.vrs(v)
			);
		}
		return this;
	}
}
