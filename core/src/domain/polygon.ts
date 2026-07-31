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

abstract class Base<T extends PolygonDomain | PolySeriesD | MP | MPs> extends BaseDomain<T> {
	constructor(domain: T) {
		super(domain);
	}
	_reproject(referencing: Referencing): this {
		super._reproject(referencing);
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
	get t(): string[] {
		return this.axes.t?.values || [];
	}
	queryIndices(point: Position): Record<string, number> {
		if (this.axes.composite.values.length === 1) return { composite: 0 }; // Its a polygon
		for (let i = 0; i < this.axes.composite.values.length; i++) {
			if (inside(point, this.axes.composite.values[i]) === false) continue;
			return {
				composite: i
			};
		}
		return {
			composite: 0
		};
	}
	normalize = undefined;
	denormalize = undefined;
	calculateAxesBounds(): this {
		return this;
	}
}

export class Polygon extends Base<PolygonDomain> {
	queryIndices(): Record<'composite', number> {
		return {
			composite: 0
		};
	}
	calculateAxesBounds(): this {
		return this;
	}
	get geometry(): PolygonGeometry {
		return {
			type: 'Polygon',
			coordinates: this.axes.composite.values[0]
		};
	}
	constructor(domain: PolygonDomain) {
		super(domain);
	}
}

export class PolygonSeries extends Base<PolySeriesD> {
	queryIndices(): Record<'composite', number> {
		return {
			composite: 0
		};
	}
	calculateAxesBounds(): this {
		return this;
	}
	get geometry(): PolygonGeometry {
		return {
			type: 'Polygon',
			coordinates: this.axes.composite.values[0]
		};
	}
	constructor(domain: PolySeriesD) {
		super(domain);
	}
}

export class MultiPolygon extends Base<MP> {
	constructor(domain: MP) {
		super(domain);
	}

	get geometry(): GeoJSON.MultiPolygon {
		return {
			type: 'MultiPolygon',
			coordinates: this.axes.composite.values
		};
	}
	split(compositeIndex: number): Polygon {
		const domain = this.toPlain();
		const { composite, z, t } = domain.axes;
		return new Polygon({
			...domain,
			domainType: 'Polygon',
			axes: {
				composite: {
					...domain.axes.composite,
					values: [composite.values[compositeIndex]],
					bounds: composite.bounds
						? [composite.bounds[2 * compositeIndex], composite.bounds[2 * compositeIndex + 1]]
						: undefined
				},
				z,
				t
			}
		});
	}
}

export class MultiPolygonSeries extends Base<MPs> {
	constructor(domain: MPs) {
		super(domain);
	}
	split(compositeIndex: number): PolygonSeries {
		const domain = this.toPlain();
		const { composite, z, t } = domain.axes;
		return new PolygonSeries({
			...domain,
			domainType: 'PolygonSeries',
			axes: {
				composite: {
					...domain.axes.composite,
					values: [composite.values[compositeIndex]],
					bounds: composite.bounds
						? [composite.bounds[2 * compositeIndex], composite.bounds[2 * compositeIndex + 1]]
						: undefined
				},
				z,
				t
			}
		});
	}
	get geometry(): GeoJSON.MultiPolygon {
		return {
			type: 'MultiPolygon',
			coordinates: this.axes.composite.values
		};
	}
}
