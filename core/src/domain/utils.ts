import type { Domain, RegularlySpacedAxis, Position, DomainTypes } from 'coveragejson';
import { Temporal } from '@js-temporal/polyfill';
import midpoint from '@turf/midpoint';
import destination from '@turf/destination';
import distance from '@turf/distance';
import bearing from '@turf/bearing';
import { InvalidDateRepresentation } from '../error.ts';
import { indicesOfNearest } from '../utils.ts';
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

export function denormalizeNumAxis(axis: RegularlySpacedAxis | { values: number[] }) {
  if ('values' in axis) return axis;
  return regularNumToValuesAxis(axis);
}
/**
 * Converts an axis to a regular one provided that it is regularly spaced
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
    values[i] = axis.start + i * step;
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
export function calcStrAxisBounds(values: string[], timeZone = 'UTC'): string[] | undefined {
  // const options: Temporal.ZonedDateTimeToStringOptions = {
  // 	calendarName: 'never',
  // 	offset: 'auto',
  // 	timeZoneName: 'never'
  // };
  // const duration: Temporal.DurationLike = {};

  // const units = {
  // 	Year: 'nanoseconds',
  // 	YearMonth: 'nanoseconds',
  // 	Date: 'nanoseconds',
  // 	Instant: 'nanoseconds'
  // } satisfies Record<TFormat, Temporal.TotalUnit<Temporal.DateTimeUnit>>;

  // const _values = values.map(parseDateString);
  // const _instances = _values.map(getTemporalInstance);
  // const bounds: (Temporal.PlainDate | Temporal.ZonedDateTime | Temporal.PlainDateTime)[] = [];
  // let step: number | undefined = undefined;
  // if (tListIsRegular(values)) {
  // 	step = _instances.at(-1)!.since(_instances[0]).total({
  // 		unit: units[_values[0].format],
  // 		relativeTo: _instances[0]
  // 	});
  // 	step /= values.length - 1;
  // }

  // for (let i = 0; i < values.length; i++) {
  // 	const unit = units[_values[i].format];
  // 	let high: number;
  // 	let low: number;
  // 	const now = _instances[i];
  // 	if (step !== undefined) high = low = step;
  // 	else {
  // 		let [prev, next] = [_instances[i - 1], _instances[i + 1]];
  // 		// Handles one element arrays
  // 		if (prev === undefined && next === undefined) {
  // 			high = low = 2;
  // 		} else {
  // 			const resolved = prev ?? next;
  // 			if (prev === undefined) prev = resolved;
  // 			if (next === undefined) next = resolved;

  // 			low = Math.abs(now.since(prev).total({ unit, relativeTo: now }));
  // 			high = Math.abs(next.since(now).total({ unit, relativeTo: now }));
  // 		}
  // 	}
  // 	const [lowMid, hiMid] = [low / 2, high / 2].map(Math.abs);
  // 	let lower = now.subtract({ [unit]: Math.trunc(lowMid) });
  // 	let upper = now.add({ [unit]: Math.trunc(hiMid) });

  // 	const [lowRem, hiRem] = [lowMid % 1, hiMid % 1];
  // 	switch (_values[i].format) {
  // 		case 'Year':
  // 			lower = lower.subtract({ months: Math.trunc(lowRem * 12) });
  // 			upper = upper.add({ months: Math.trunc(hiRem * 12) });
  // 			break;
  // 		case 'YearMonth':
  // 			lower = lower.subtract({ days: Math.trunc(lowRem * now.daysInMonth) });
  // 			upper = upper.add({ days: Math.trunc(hiRem * now.daysInMonth) });
  // 			break;
  // 		case 'Date':
  // 			lower = lower.toPlainDateTime({
  // 				hour: Math.trunc(lowRem * 24),
  // 				minute: ((lowRem * 24) % 1) * 60
  // 			});
  // 			upper = upper.toPlainDateTime({
  // 				hour: Math.trunc(hiRem * 24),
  // 				minute: ((hiRem * 24) % 1) * 60
  // 			});
  // 	}
  // 	bounds.push(lower, upper);
  // }

  // return bounds
  // 	.map((x) => {
  // 		if (x instanceof Temporal.ZonedDateTime) {
  // 			return x.withTimeZone(timeZone);
  // 		}
  // 		return x;
  // 	})
  // 	.map((x) => x.toString(options));
  return undefined;
}

/**
 * @returns {false} for lists of length 1 or less
 * @todo check for monoticity because 2021,2022,2021 is technically regular (maybe checked already)
 * todo fix where lists of 2 elements are not regular despite being so
 */
export function tListIsRegular(values: string[]): boolean {
  if (values.length < 2) return false;
  let duration: Temporal.Duration;
  for (let i = 1; i < values.length; i++) {
    const [ref, now] = [values[i - 1], values[i]].map(parseDateString);
    // Add cache so as not to do parsing again;
    if (ref.resolution !== now.resolution) return false;
    const [refn, nown] = [ref, now].map(getTemporalInstance);

    const dur = nown.since(refn);
    if (i === 1) duration = dur;
    if (Temporal.Duration.compare(duration!, dur) === 0) continue;
    return false;
  }
  return true;
}

export function numAxisIsNormalized(
  axis: { values: number[] } | RegularlySpacedAxis
): axis is RegularlySpacedAxis {
  if ('values' in axis) return false;
  return true;
}

// This generates lower and  upper bounds for each coordinate pair as it should
export function calc2dTupleAxisBounds(positions: Position[]): number[][] {
  if (positions.length === 1)
    return [
      [positions[0][0] - 1, positions[0][1] - 1],
      [positions[0][0] + 1, positions[0][1] + 1]
    ];
  const bounds: number[][] = [];

  for (let i = 0; i < positions.length; i++) {
    const ref = positions[i];
    let prev = positions[i - 1];
    let next = positions[i + 1];
    // Distance between two points
    let dist: number;
    // Bearing between two points. Need to wrap around to ensure it faces around (360)
    let bear: number;
    if (!prev || !next) {
      if (!prev) {
        dist = distance(ref, next);
        bear = bearing(ref, next) - 180;
        prev = destination(ref, dist, bear).geometry.coordinates as Position;
      } else {
        dist = distance(ref, prev);
        bear = bearing(ref, prev) + 180;
        next = destination(ref, dist, bear).geometry.coordinates as Position;
      }
    }
    bounds.push(midpoint(ref, prev).geometry.coordinates);
    bounds.push(midpoint(ref, next).geometry.coordinates);
  }
  return bounds;
}

/**
 * Internal helper used to calculate bounds
 */
export function getTemporalInstance(res: DateTimeParseResult) {
  if (res.resolution === 'Instant') {
    return Temporal.ZonedDateTime.from({ ...res, timeZone: res.offset }, { offset: 'use' }); //.withTimeZone("UTC").toString({"timeZoneName"});
  }
  if (res.resolution === 'YearMonth') res.day = 1;
  if (res.resolution === 'Year') {
    res.day = 1;
    res.month = 1;
  }

  return Temporal.PlainDate.from({ ...res });
}

export type TemporalResolution = 'Instant' | 'Date' | 'Year' | 'YearMonth';
type DateTimeParseResult<T extends TemporalResolution = TemporalResolution> = {
  resolution: T;
  year: number;
  month: T extends 'Year' ? undefined : number;
  day: T extends 'YearMonth' | 'Year' ? undefined : number;
  hour: T extends 'Instant' ? number : undefined;
  minute: T extends 'Instant' ? number : undefined;
  second: T extends 'Instant' ? number : undefined;
  offset: T extends 'Instant' ? string : undefined;
};

export function parseDateString(val: string): DateTimeParseResult {
  let resolution: TemporalResolution;
  let year: number;
  let month: number | undefined;
  let day: number | undefined;
  let hour: number | undefined;
  let minute: number | undefined;
  let second: number | undefined;
  let offset: string | undefined;

  const parts = val.split('-');
  if (parts.length === 1) {
    year = Number(parts[0]);
    if (!Number.isInteger(year)) throw new InvalidDateRepresentation('YYYY or +-DYYYY', val);
    resolution = 'Year';
  } else if (parts.length === 2) {
    [year, month] = parts.map(Number);
    if (Number.isNaN(year) || Number.isNaN(month))
      throw new InvalidDateRepresentation('YYYY-MM', val);
    resolution = 'YearMonth';
  } else {
    // eslint-disable-next-line prefer-const
    let [date, time] = val.split('T');
    [year, month, day] = date.split('-').map(Number);
    resolution = 'Date';
    if (val.indexOf('T') !== -1) {
      resolution = 'Instant';
      if (time.indexOf('Z') !== -1) time = time.replace('Z', '+00:00');
      let direction: '+' | '-' = '+';
      if (time.indexOf('-') !== -1) direction = '-';
      [time, offset] = time.split(direction);
      const hh = time.split(':').map(Number);
      // if (hh.some(Number.isNaN)) throw new InvalidDateRepresentation('TimeStamp', val);
      [hour, minute, second] = hh;
      offset = direction + offset;
    }
  }
  return {
    resolution,
    year,
    month,
    day,
    hour,
    minute,
    second,
    offset
  };
}

/**
 * A function to get the nearest indices of the nearest t values
 * Expects strings of the same resolution because all strings are converted to ZonedDateTime and compared via epoch milliseconds
 * @todo calcStringAxis. Find a way to compute the midpoints of YYYY/YYYY-MM-DD/YYYY-MM-DD reliably
 * @deprecated Unstable
 */
export function tIndicesOfNearest(a: string[], t: string) {
  if (a.length === 0) throw Error(``);
  const sinceEpoch = [t, ...a].map(parseDateString).map((v) => {
    v.month = v.month || 1;
    v.day = v.day || 1;
    v.hour = v.hour || 0;
    v.minute = v.minute || 0;
    v.second = v.second || 0;
    v.offset = v.offset || '+00:00';
    return Temporal.ZonedDateTime.from({ ...v, timeZone: v.offset }).epochMilliseconds;
  });
  return indicesOfNearest(sinceEpoch.slice(1), sinceEpoch[0]);
}

export function isUndefined<T>(val: T | undefined): val is undefined {
  return typeof val === 'undefined';
}
