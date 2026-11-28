import type {
	Domain,
	MultiPoint,
	MultiPointSeries,
	Point,
	PointSeries,
	Polygon,
	PolygonSeries,
	VerticalProfile,
	Trajectory,
	RegularlySpacedAxis,
	Section
} from 'coveragejson';
import { Base } from '../base.ts';
import { Referencing } from '../referencing.ts';
import { axisOptionsToList, bboxToPolygon, indexOfNearest } from '../utils.ts';
import type { Indices, Reference } from '../types';
import type { BBox } from 'geojson';

export abstract class BaseDomain<D extends Domain = Domain> extends Base<D> {
	type: D['type'];
	domainType: D['domainType'];
	axes: D['axes'];
	referencing: Referencing | undefined;
	constructor(domain: D) {
		super();
		this.type = domain.type;
		this.domainType = domain.domainType;
		this.axes = domain.axes;
		this.referencing = new Referencing(domain.referencing);
	}

	/**
	 * An unsorted list of t values in the domain's axes
	 */
	abstract get t(): string[];
	/**
	 * An unsorted list of z values in the domain's axes.
	 * For some domains, it is cheaper to find the value's index here instead of looping through tuples
	 */
	abstract get z(): number[];
	/**
	 * Number of axis values in the domain
	 */
	abstract get axesSize(): Map<keyof D['axes'], number>;
	/**
	 * Note that this is a clone of the class's core deets
	 */
	toJSON(): D {
		return {
			type: this.type,
			domainType: this.domainType,
			axes: JSON.parse(JSON.stringify(this.axes)),
			referencing: this.referencing?.toJSON()
		} as D;
	}
	/**
	 * If applicable, converts any "primitive" axis to @see {RegularlySpacedAxis}
	 */
	normalize(): this {
		return this;
	}

	abstract denormalize(): Omit<this, 'axes'> & {
		axes: { [axisName in keyof D['axes']]: Exclude<D['axes'][axisName], RegularlySpacedAxis> };
	};
	/**
	 * Get the geojson representation of the domain's "horizontal" values
	 */
	abstract get geometry(): D extends Point | PointSeries | VerticalProfile
		? GeoJSON.Point
		: D extends Polygon | PolygonSeries
			? GeoJSON.Polygon
			: D extends MultiPoint | MultiPointSeries | Section | Trajectory
				? GeoJSON.MultiPoint
				: GeoJSON.MultiPolygon;

	tIndex(t: string): number {
		return indexOfNearest(
			this.t.map((t) => new Date(t).getTime()),
			new Date(t).getTime()
		);
	}
	zIndex(z: number): number {
		return indexOfNearest(this.z, z);
	}
	abstract queryIndices(ref: Reference): Map<keyof D['axes'], number>;
	subset(constraints: BBox | Record<string, Indices>): this | undefined {
		if (Array.isArray(constraints)) {
			constraints = this._constraintsFromBbox(bboxToPolygon(constraints));
		}
		return this._applySubset(this._parseConstraints(constraints));
	}
	_parseConstraints(constraints: Record<string, Indices>): Map<string, Set<number>> {
		const _constraints = new Map<string, Set<number>>();
		for (const [axisName, size] of this.axesSize) {
			// Handles 0D axes and invalid keys
			if (!size) continue;
			let constraint = constraints[axisName as string] ?? true;

			constraint = axisOptionsToList(size, constraint);
			if (!constraint.length) constraint = [0]; // Dont lose all info
			_constraints.set(axisName as string, new Set(constraint));
		}

		for (const k in constraints) {
			if (!this.axesSize.has(k as keyof D['axes'])) _constraints.delete(k);
		}
		return _constraints;
	}
	abstract _applySubset(constraints: Map<string, Set<number>>): this | undefined;
}
