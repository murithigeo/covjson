import { BaseDomain } from './base-domain.ts';
import type { Trajectory as TrajDomain, Section as SectionDomain } from '../coveragejson.d.ts';
import type { Referencing } from '../referencing.ts';
import type { LineString } from 'geojson';
import { denormalizeNumAxis, normalizeNumAxis, numAxisIsNormalized } from './utils.ts';
import { minMax } from '../utils.ts';
import distance from '@turf/distance';
import type { WithoutRegularlySpacedAxis } from './types.js';

abstract class Base<T extends TrajDomain | SectionDomain> extends BaseDomain<T> {
	constructor(domain: T) {
		super(domain);
	}
	calculateAxesBounds(): this {
		return this;
	}
	_reproject(referencing: Referencing): this {
		super._reproject(referencing);
		for (let i = 0; i < this.axes.composite.values.length; i++) {
			let [t, x, y, z] = this.axes.composite.values[i];
			t = referencing.trs(t);
			[x, y] = referencing.crs([x, y]);
			this.axes.composite.values[i] = [t, x, y];
			if (z === undefined) continue;
			z = referencing.vrs(z);
			this.axes.composite.values[i][3] = z;
		}
		if (this.axes.z) {
			if (!numAxisIsNormalized(this.axes.z))
				this.axes.z.values = this.axes.z.values.map(referencing.vrs);
			else {
				[this.axes.z.start, this.axes.z.stop] = [this.axes.z.start, this.axes.z.stop].map(
					referencing.vrs
				);
			}
		}
		return this;
	}
	normalize(): this {
		if (!this.axes.z) return this;
		this.axes.z = normalizeNumAxis(this.axes.z);
		return this;
	}
	denormalize(): WithoutRegularlySpacedAxis<this> {
		if (this.axes.z) this.axes.z = denormalizeNumAxis(this.axes.z);
		//@ts-expect-error WithoutRegularlySpacedAxis is not correctly extended
		return this;
	}
	get t(): string[] {
		return this.axes.composite.values.map(([t]) => t);
	}
}

export class Trajectory extends Base<TrajDomain> {
	queryIndices(point: [number, number]): Record<'composite', number> {
		const distances = this.axes.composite.values.map(([, lon, lat]) => distance(point, [lon, lat]));
		const [minD] = minMax(distances);
		return {
			composite: minD === null ? 0 : distances.findIndex((dist) => minD === dist)!
		};
	}
	get z(): number[] {
		const values = this.axes.composite.values.map(([, , , z]) => z).filter((v) => v !== undefined);
		if (this.axes.z) values.push(this.axes.z.values[0]);
		return values;
	}
	get geometry(): LineString {
		return {
			type: 'LineString',
			coordinates: this.axes.composite.values.map(([, x, y, z]) => {
				if (z === undefined) return [x, y];
				return [x, y, z];
			})
		};
	}
	constructor(domain: TrajDomain) {
		super(domain);
	}
}

export class Section extends Base<SectionDomain> {
	queryIndices(point: [number, number]): Record<'composite', number> {
		const distances = this.axes.composite.values.map(([, lon, lat]) => distance(point, [lon, lat]));
		const [minD] = minMax(distances);
		return {
			composite: minD === null ? 0 : distances.findIndex((dist) => minD === dist)!
		};
	}
	get z(): number[] {
		return denormalizeNumAxis(this.axes.z).values;
	}
	get geometry(): LineString {
		return {
			type: 'LineString',
			coordinates: this.axes.composite.values.map(([, x, y]) => [x, y])
		};
	}
	constructor(domain: SectionDomain) {
		super(domain);
	}
}
