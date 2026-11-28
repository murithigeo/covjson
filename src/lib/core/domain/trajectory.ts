import { BaseDomain } from './base-domain.ts';
import type { Trajectory as TrajDomain, Position } from 'coveragejson';
import type { Referencing } from '../referencing.ts';
import type { MultiPoint, Polygon } from 'geojson';
import { isUndefined } from './utils.ts';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import type { GraduatedIndices, Indices } from '../types';
import intersects from '@turf/boolean-intersects';
export class Trajectory extends BaseDomain<TrajDomain> {
	_constraintsFromBbox({
		polygon
	}: {
		polygon: Polygon;
		z: GraduatedIndices | undefined;
	}): Record<string, Indices> {
		const results: Record<string, number[]> = { z: [0] };

		if (this.axes.composite.values.length === 1) results.composite = [0];
		else {
			results.composite = [];
			for (let i = 0; i < this.axes.composite.values.length; i++) {
				const [, ...coordinates] = this.axes.composite.values[i];
				if (!intersects(polygon, { type: 'Point', coordinates })) continue;

				results.composite.push(i);
			}
		}
		return results;
	}

	_applySubset(indices: Map<string, Set<number>>): this | undefined {
		const { composite } = Object.fromEntries(indices);
		if (!composite.size) return undefined;
		this.axes.composite.values = this.axes.composite.values.filter((_, i) => composite.has(i));
		return this;
	}
	denormalize(): this {
		return this;
	}

	get axesSize(): Map<'z' | 'composite', number> {
		return new Map()
			.set('composite', this.axes.composite.values.length)
			.set('z', this.axes.z ? 1 : 0);
	}
	/**
	 *
	 * @param point We can also pass a time string instead because it can be easier
	 * @returns
	 */
	queryIndices(ref: Position | string | number): Map<'z' | 'composite', number> {
		const indices = new Map().set('z', 0);
		let composite: number;
		if (typeof ref === 'string') composite = this.tIndex(ref);
		else if (typeof ref === 'number') composite = this.zIndex(ref);
		else {
			({
				properties: { segmentIndex: composite }
			} = nearestPointOnLine({ ...this.geometry, type: 'LineString' }, ref));
		}
		indices.set('composite', composite);
		return indices;
	}
	get z(): number[] {
		return this.axes.composite.values.map(([, , , z]) => z).filter((v) => !isUndefined(v));
		// if (this.axes.z) values.push(this.axes.z.values[0]); // x is single value so ignore
	}
	get geometry(): MultiPoint {
		return {
			type: 'MultiPoint',
			coordinates: this.axes.composite.values.map(([, x, y, z]) => {
				if (isUndefined(z)) return [x, y];
				return [x, y, z];
			})
		};
	}

	_reproject(referencing: Referencing): this {
		for (let i = 0; i < this.axes.composite.values.length; i++) {
			let [t, x, y, z] = this.axes.composite.values[i];
			t = referencing.trs(t);
			[x, y] = referencing.crs([x, y]);
			this.axes.composite.values[i] = [t, x, y];
			if (isUndefined(z)) continue;
			z = referencing.vrs(z);
			this.axes.composite.values[i][3] = z;
		}
		if (this.axes.z) this.axes.z.values[0] = referencing.vrs(this.axes.z.values[0]);
		return this;
	}

	get t() {
		return this.axes.composite.values.map(([t]) => t);
	}
}
