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
import type { GraduatedIndices, Indices } from '../types';
import intersects from '@turf/boolean-intersects';
abstract class Base<T extends PolygonDomain | PolySeriesD | MP | MPs> extends BaseDomain<T> {
	get axesSize(): Map<keyof T['axes'], number> {
		return new Map()
			.set('composite', this.axes.composite.values.length)
			.set('t', this.t.length)
			.set('z', this.z.length);
	}
	_reproject(referencing: Referencing): this {
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
	get t() {
		if (!this.axes.t) return [];
		return this.axes.t.values.map((v) => v);
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
	_constraintsFromBbox({
		polygon
	}: {
		polygon: PolygonGeometry;
		z: GraduatedIndices | undefined;
	}): Record<string, Indices> {
		const results: Record<string, number[]> = {};

		results.composite = [];
		for (let i = 0; i < this.axes.composite.values.length; i++) {
			if (!intersects(polygon, { type: 'Polygon', coordinates: this.axes.composite.values[i] })) {
				continue;
			}
			results.composite.push(i);
		}

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

export class Polygon extends Base<PolygonDomain> {
	denormalize(): this {
		return this;
	}

	get geometry(): PolygonGeometry {
		return {
			type: 'Polygon',
			coordinates: this.axes.composite.values[0]
		};
	}
}

export class PolygonSeries extends Base<PolySeriesD> {
	denormalize(): this {
		return this;
	}

	get geometry(): PolygonGeometry {
		return {
			type: 'Polygon',
			coordinates: this.axes.composite.values[0]
		};
	}
}

export class MultiPolygon extends Base<MP> {
	denormalize(): this {
		return this;
	}

	get geometry(): GeoJSON.MultiPolygon {
		return {
			type: 'MultiPolygon',
			coordinates: this.axes.composite.values
		};
	}
}

export class MultiPolygonSeries extends Base<MPs> {
	denormalize(): this {
		return this;
	}

	get geometry(): GeoJSON.MultiPolygon {
		return {
			type: 'MultiPolygon',
			coordinates: this.axes.composite.values
		};
	}
}
