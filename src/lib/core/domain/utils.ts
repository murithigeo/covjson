import type { Domain, RegularlySpacedAxis, Position, DomainTypes } from 'coveragejson';
import { indicesOfNearest } from '../utils.js';
/**
 * Programmatically determine the "domainType" of a domain if the property has not been set
 * Very shallow checker
 */
export function inferDomainType(domain: Domain): NonNullable<DomainTypes> {
	if (domain.domainType) return domain.domainType;
	if ('x' in domain.axes && 'y' in domain.axes) {
		if (numAxisIsNormalized(domain.axes.x) || domain.axes.x.values.length > 1) return 'Grid';
		if (numAxisIsNormalized(domain.axes.y) || domain.axes.y.values.length > 1) return 'Grid';
		if ('z' in domain.axes && domain.axes.z) {
			if (numAxisIsNormalized(domain.axes.z) || domain.axes.z.values.length > 1)
				return 'VerticalProfile';
		}
		if (domain.axes.t && domain.axes.t?.values.length > 1) return 'PointSeries';
		return 'Point';
	}
	if (domain.axes.composite.dataType === 'polygon') {
		if (domain.axes.composite.values.length === 1) {
			if ('t' in domain.axes && domain.axes.t && domain.axes.t.values.length > 1)
				return 'PolygonSeries';
			return 'Polygon';
		}
		if ('t' in domain.axes && domain.axes.t && domain.axes.t.values.length > 1) {
			return 'MultiPolygonSeries';
		}
		return 'MultiPolygon';
	}
	if ('z' in domain.axes && domain.axes.z) {
		if (numAxisIsNormalized(domain.axes.z) || domain.axes.z.values.length > 1) return 'Section';
		return 'Trajectory';
	}
	if ('t' in domain.axes && domain.axes.t) {
		if (domain.axes.t.values.length > 1) return 'MultiPointSeries';
	}
	return 'MultiPoint';
}

/**
 * Convert a {@link RegularlySpacedAxis} to a values axis
 */
export function denormalizeNumAxis(axis: RegularlySpacedAxis | { values: number[] }) {
	if ('values' in axis) return axis;
	return regularNumToValuesAxis(axis);
}
/**
 * Convert a values axis object to a {@link RegularlySpacedAxis}
 */
export function normalizeNumAxis(axis: { values: number[] } | RegularlySpacedAxis) {
	if ('values' in axis) {
		if (!numListIsRegular(axis.values)) return axis;
		axis = {
			start: axis.values[0],
			stop: axis.values.at(-1)!,
			num: axis.values.length
		};
	}
	return axis;
}

export function regularNumToValuesAxis(axis: RegularlySpacedAxis): { values: number[] } {
	if (axis.num === 1) {
		if (axis.start !== axis.stop) {
			throw Error(`If 'num'=1, then 'start' must be equal to 'stop'`);
		}
		return { values: [axis.start] };
	}
	const step = (axis.stop - axis.start) / (axis.num - 1);
	const values: number[] = [];
	for (let i = 0; i < axis.num; i++) {
		values[i] = toGeoJsonCoordinate(axis.start + i * step);
	}
	return { values };
}
/**
 * Checks whether the values are regularly spaced
 * By default a one element array or two element array is also regular
 * Because if used to validate and generate a regularly spaced axis, then the regularlyspacedaxis uses a lot more bytes?
 */
export function numListIsRegular(values: number[]): boolean {
	if (values.length < 3) return true;
	let ref: number;
	for (let i = 1; i < values.length; i++) {
		const diff = values[i - 1] - values[i];
		if (i === 1) ref = diff;
		if (ref! !== diff) return false;
	}
	return true;
}
export function calcNumAxisBounds<T extends number[]>(values: number[]): T {
	if (values.length === 1) return [values[0] - 1, values[0] + 1] as T;
	if (numListIsRegular(values)) {
		let step = (values.at(-1)! - values[0]) / (values.length - 1);
		// Divide by two to get halfway between the values
		step /= 2;
		return values.flatMap((val) => [val - step, val + step]) as T;
	}

	const bounds = Array<number>(values.length * 2);
	for (let i = 0; i < values.length; i++) {
		let ceiling = values[i + 1] - values[i];
		let floor = values[i] - values[i - 1];

		// At last el so just use lower
		if (isNaN(ceiling)) ceiling = floor;

		// At first element so use upper
		if (isNaN(floor)) floor = ceiling;
		ceiling /= 2;
		floor /= 2;
		const min = values[i] - floor;
		const max = values[i] + ceiling;
		bounds[2 * i] = min;
		bounds[2 * i + 1] = max;
	}
	return bounds as T;
}

export function numAxisIsNormalized(
	axis: { values: number[] } | RegularlySpacedAxis
): axis is RegularlySpacedAxis {
	if ('values' in axis) return false;
	return true;
}

/**
 * A function to get the nearest indices of the nearest t values
 * Expects strings of the same resolution because the values are passed as arg to the Date class
 */
export function tIndicesOfNearest(a: Array<string | number>, t: string | number) {
	if (a.length === 0) throw Error(``);
	t = new Date(t).getTime();
	a = [...a.map((v) => new Date(v).getTime())];
	return indicesOfNearest(a as number[], t);
}

export function isUndefined(val: unknown): val is undefined {
	return typeof val === 'undefined';
}
export function isNull(val: unknown | null): val is null {
	return val === null;
}

export class CustomDate extends Date {
	/**
	 * The original date argument
	 */
	value: string;
	constructor(value: string) {
		super(value);
		this.value = value;
	}
	// Implement the parse string
}

export function geojsonCompliantPosition(pos: Position): Position {
	for (let i = 0; i < 2; i++) pos[i] = toGeoJsonCoordinate(pos[i]);

	return pos;
}

export function toGeoJsonCoordinate(val: number) {
	return Math.trunc(val * Math.pow(10, 8)) / Math.pow(10, 8);
}
