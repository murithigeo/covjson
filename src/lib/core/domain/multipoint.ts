import { BaseDomain } from './base-domain.ts';
import type {
	MultiPointSeries as MpsD,
	MultiPoint as MpD,
	Position,
	Section as SectionDomain,
	Position2D,
	WithBounds
} from 'coveragejson';
import { Referencing } from '../referencing.ts';
import type { MultiPoint as MultiPointGeometry, Polygon } from 'geojson';
import { isUndefined, denormalizeNumAxis } from './utils.ts';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import type { GraduatedIndices, Indices } from '../types';
import intersects from '@turf/boolean-intersects';
import { axisOptionsToList } from '../utils.ts';
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

	_constraintsFromBbox({
		polygon,
		z
	}: {
		polygon: Polygon;
		z: GraduatedIndices | undefined;
	}): Record<string, Indices> {
		const results: Record<string, number[]> = {};

		for (let i = 0; i < this.axes.composite.values.length; i++) {
			const coordinates = this.axes.composite.values[i];
			if (!intersects({ type: 'Point', coordinates }, polygon)) continue;
			if (z && !isUndefined(coordinates[2])) {
				if (z.start <= coordinates[2]) continue;
				if (!isUndefined(z.stop) && z.stop <= coordinates[2]) continue;
			}
			results.composite = results.composite || [];
			results.composite.push(i);
		}
		results.t = axisOptionsToList(this.axesSize.get('t'), true);
		return results;
	}
	_applySubset(indices: Map<string, Set<number>>): this | undefined {
		const { composite, t } = Object.fromEntries(indices);
		if (!composite.size) return undefined;

		this.axes.composite.values = this.axes.composite.values.filter((_, i) => composite.has(i));

		if (this.axes.t) this.axes.t.values = this.axes.t.values.filter((_, i) => t.has(i));
		return this;
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
	_constraintsFromBbox({
		polygon,
		z
	}: {
		polygon: Polygon;
		z: GraduatedIndices | undefined;
	}): Record<string, Indices> {
		const results: Record<string, number[]> = {};
		for (let i = 0; i < this.axes.composite.values.length; i++) {
			const [, ...coordinates] = this.axes.composite.values[i];
			if (!intersects(polygon, { type: 'Point', coordinates })) continue;
			results.composite = results.composite || [];
			results.composite.push(i);
		}
		if (z) {
			results.z = [];
			for (let i = 0; i < this.z.length; i++) {
				if (z.start < this.z[i]) continue;
				if (!isUndefined(z.stop) && this.z[i] > z.stop) continue;
				results.z.push(i);
			}
		}

		return results;
	}
	_applySubset(indices: Map<string, Set<number>>): this | undefined {
		const { composite, z } = Object.fromEntries(indices);
		if (!composite.size || !z.size) return undefined;
		this.axes.z = denormalizeNumAxis(this.axes.z);
		this.axes.composite.values = this.axes.composite.values.filter((_, i) => composite.has(i));
		this.axes.z.values = this.axes.z.values.filter((_, i) => z.has(i));
		return this;
	}
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
