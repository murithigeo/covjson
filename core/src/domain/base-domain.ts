import type {
	Domain,
	MultiPoint,
	MultiPointSeries,
	Point,
	PointSeries,
	Polygon,
	PolygonSeries,
	Section,
	VerticalProfile,
	Trajectory,
	ReferenceSystemConnection,
	Position
} from 'coveragejson';
import { Base } from '../base.ts';
import type { Referencing } from '../referencing.ts';
import type { WithoutRegularlySpacedAxis } from './types.d.ts';
import { tIndicesOfNearest } from './utils.ts';
import { indicesOfNearest } from '../utils.ts';

export abstract class BaseDomain<T extends Domain> extends Base<T> {
	type: T['type'];
	domainType: T['domainType'];
	axes: T['axes'];
	#referencing: T['referencing'] | undefined;
	constructor(domain: T) {
		super();
		this.type = domain.type;
		this.domainType = domain.domainType;
		this.axes = domain.axes;
		this.#referencing = domain.referencing;
	}
	public get referencing(): T['referencing'] {
		return this.#referencing;
	}
	abstract queryIndices(point: Position): Map<keyof T['axes'], number>;
	/**
	 * @todo implement a temporal and vertical method for finding indices
	 */
	/**
	 * An unsorted list of t values in the domain's axes
	 */
	abstract get t(): string[];
	/**
	 * An unsorted list of z values in the domain's axes
	 * For some domains, it is cheaper to find the value's index here instead of looping through tuples
	 */
	abstract get z(): number[];
	/**
	 * Calculates and sets the "bounds" property of each axis in the domain
	 * Will overwrite the property if value has been set
	 * @todo remove mention in the types and make this an optional module because of the dependencies it requires
	 * @param timeZone The offset or IANA TimeZone name to use for instants
	 */
	abstract calculateAxesBounds(timeZone?: string): this;
	/**
	 * Number of axis values in the domain
	 */
	abstract get axesMaxIndices(): Map<keyof T['axes'], number>;
	/**
	 * Note that this is a clone of the class's core deets
	 */
	toPlain(useRefs = true): T {
		return structuredClone({
			type: this.type,
			domainType: this.domainType,
			axes: this.axes,
			referencing: useRefs ? this.referencing : undefined
		}) as T;
	}
	/**
	 * If applicable, converts any "primitive" axis to @see {RegularlySpacedAxis}
	 * Returns a new copy of the class
	 */
	abstract normalize?(): this;
	/**
	 * If applicable,converts any @see {RegularlySpacedAxis} to a primitive axis
	 * Returns a new copy of the class
	 */
	abstract denormalize?(): WithoutRegularlySpacedAxis<BaseDomain<T>>;
	/**
	 * Get the geojson representation of the domain's "horizontal" values
	 */
	abstract get geometry(): T extends Point | PointSeries | VerticalProfile
		? GeoJSON.Point
		: T extends Trajectory | Section
			? GeoJSON.LineString
			: T extends Polygon | PolygonSeries
				? GeoJSON.Polygon
				: T extends MultiPoint | MultiPointSeries
					? GeoJSON.MultiPoint
					: GeoJSON.MultiPolygon;
	_reproject(referencing: Referencing): this {
		this.referencing = referencing.connections;
		return this;
	}
	set referencing(referencing: ReferenceSystemConnection[] | undefined) {
		this.#referencing = referencing;
	}

	indexOfT = (t: string) => tIndicesOfNearest(this.t, t);
	indexOfZ = (z: number) => indicesOfNearest(this.z, z);
	/**
	 * We can have a method that returns boolean for boolean intersects
	 * Another for determining which composite values intersect ie. for polygons,multipoints which are computationally expensive
	 */
	// intersects()
}
