/**
 * @see https://github.com/Reading-eScience-Centre/covutils/blob/master/src/array.js
 */

/**
 * Get the smallest and largest values in array
 */
export function minMax(arr: number[]) {
	let len = arr.length;
	let min: number | null = Infinity;
	let max: number | null = -Infinity;
	while (len--) {
		const el = arr[len];
		if (el == null) {
			// do nothing
		} else if (el < min) {
			min = el;
		} else if (el > max) {
			max = el;
		}
	}
	if (min === Infinity) {
		min = max;
	} else if (max === -Infinity) {
		max = min;
	}
	if (min === Infinity || min === -Infinity) {
		// all values were null
		min = null;
		max = null;
	}
	return [min, max];
}

/**
 * Return the indices of the two neighbors in the sorted array closest to the given number.
 * @param {Array<number>} a The array to search through. Must be sorted, ascending or descending.
 * @param {number} x The target number.
 * @return {[lo,hi]} The indices of the two closest values, may be equal.
 *   If `x` exists in the array, both neighbors point to `x`.
 *   If `x` is lower (greater if descending) than the first value, both neighbors point to 0.
 *   If `x` is greater (lower if descending) than the last value, both neighbors point to the last index.
 */
export function indicesOfNearest(a: number[], x: number): [number, number] {
	if (a.length === 0) {
		throw new Error('Array must have at least one element');
	}
	let lo = -1;
	let hi = a.length;
	const ascending = a.length === 1 || a[0] < a[1];
	// we have two separate code paths to help the runtime optimize the loop
	if (ascending) {
		while (hi - lo > 1) {
			const mid = Math.round((lo + hi) / 2);
			if (a[mid] <= x) {
				lo = mid;
			} else {
				hi = mid;
			}
		}
	} else {
		while (hi - lo > 1) {
			const mid = Math.round((lo + hi) / 2);
			if (a[mid] >= x) {
				// here's the difference
				lo = mid;
			} else {
				hi = mid;
			}
		}
	}
	if (a[lo] === x) hi = lo;
	if (lo === -1) lo = hi;
	if (hi === a.length) hi = lo;
	return [lo, hi];
}

/**
 * Return the index of the value closest to the given number in a sorted array.
 * @param {Array<number>} a The array to search through. Must be sorted, ascending or descending.
 * @param {number} x The target number.
 * @return {number} The array index whose value is closest to `x`.
 *   If `x` happens to be exactly between two values, then the lower index is returned.
 */
export function indexOfNearest(a: number[], x: number): number {
	const i = indicesOfNearest(a, x);
	const lo = i[0];
	const hi = i[1];
	if (Math.abs(x - a[lo]) <= Math.abs(x - a[hi])) {
		return lo;
	} else {
		return hi;
	}
}

export function cartesianProduct<T>(...args: T[][]):T[][] {
	return args.reduce<T[][]>((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]]);
}

/**
 * https://github.com/bobbyhadz/typescript-make-property-required/blob/main/src/index.ts
 */
export type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
	[Property in Key]-?: Type[Property];
};
