import { BaseDomain } from './base-domain.js';
import type { Trajectory as TrajDomain, Position } from 'coveragejson';
import type { Referencing } from '../referencing.js';
import type { MultiPoint } from 'geojson';
import { isUndefined } from './utils.js';
import nearestPointOnLine from '@turf/nearest-point-on-line';

export class Trajectory extends BaseDomain<TrajDomain> {
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
