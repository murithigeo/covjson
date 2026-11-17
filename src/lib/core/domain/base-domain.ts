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
	Position,
	RegularlySpacedAxis,
	Section
} from 'coveragejson';
import { Base } from '../base.js';
import { Referencing } from '../referencing.js';
import { indexOfNearest } from '../utils.js';

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
	toJSON(useRefs = true): D {
		return {
			type: this.type,
			domainType: this.domainType,
			axes: { ...this.axes },
			referencing: useRefs ? [...(this.referencing?.toJSON() || [])] : undefined
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
		: D extends Trajectory
			? GeoJSON.LineString
			: D extends Polygon | PolygonSeries
				? GeoJSON.Polygon
				: D extends MultiPoint | MultiPointSeries | Section
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
	abstract queryIndices(ref: Position | string | number): Map<keyof D['axes'], number>;
	/**
	 * We can have a method that returns boolean for boolean intersects
	 * Another for determining which composite values intersect ie. for polygons,multipoints which are computationally expensive
	 */
}
