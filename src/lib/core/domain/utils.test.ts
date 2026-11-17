import { describe, expect, it } from 'vitest';
import {
	regularNumToValuesAxis,
	inferDomainType,
	normalizeNumAxis,
	numListIsRegular,
	calcNumAxisBounds,
	tIndicesOfNearest
} from './utils.js';

describe('#regularNumToValuesAxis', () => {
	const { values } = regularNumToValuesAxis({ num: 1, start: 0, stop: 0 });
	it('elements at [0] and [-1] are start and stop', () => {
		expect(values.at(0)).toBe(0);
		expect(values.at(-1)).toBe(0);
	});
	it.skip('array length == num', () => {
		expect(values.length).toBe(1);
	});

	it('throw error if start!==stop when num=1', () => {
		expect(() => regularNumToValuesAxis({ start: 1, stop: 2, num: 1 })).toThrow();
	});
});

describe('axis normalization/denormalization', () => {
	describe('#regularNumToValuesAxis', () => {
		const { values } = regularNumToValuesAxis({ num: 1, start: 0, stop: 0 });
		it('elements at [0] and [-1] are start and stop', () => {
			expect(values.at(0)).toBe(0);
			expect(values.at(-1)).toBe(0);
		});
		it.skip('array length == num', () => {
			expect(values.length).toBe(1);
		});

		it('throw error if start!==stop when num=1', () => {
			expect(() => regularNumToValuesAxis({ start: 1, stop: 2, num: 1 })).toThrow();
		});
	});
	describe('#normalizeNumAxis', () => {
		it('returns RegularlySpacedAxis if axis is regular', () => {
			expect(normalizeNumAxis({ values: [2022, 2021] })).toEqual({
				start: 2022,
				num: 2,
				stop: 2021
			});
		});
		it('returns values object is axis is irregular', () => {
			expect(normalizeNumAxis({ values: [20] })).toEqual({ start: 20, stop: 20, num: 1 });
		});
	});

	describe('#numAxisIsRegular', () => {
		it('Returns true if num axis is regularly spaced', () => {
			expect(numListIsRegular([2021, 2022])).toBeTruthy();
			expect(numListIsRegular([2021, 2022, 2024])).toBeFalsy();
			expect(numListIsRegular([2021])).toBeTruthy();
		});
	});
});

describe('#inferDomainType', () => {
	it('infers Grid', () => {
		expect(
			inferDomainType({
				type: 'Domain',
				axes: {
					x: { values: [20, 1] },
					y: { values: [20, 1] }
				}
			})
		).toBe('Grid');
		expect(
			inferDomainType({
				type: 'Domain',
				axes: { x: { start: 1, stop: 2, num: 20 }, y: { values: [20, 1] } }
			})
		).toBe('Grid');
	});
	it('infers Point', () => {
		expect(
			inferDomainType({ type: 'Domain', axes: { x: { values: [10] }, y: { values: [20] } } })
		).toBe('Point');
		expect(
			inferDomainType({
				type: 'Domain',
				axes: { x: { values: [10] }, y: { values: [20] }, t: { values: ['2021'] } }
			})
		).toBe('Point');
	});
	it('infers PointSeries', () => {
		expect(
			inferDomainType({
				type: 'Domain',
				axes: { x: { values: [10] }, y: { values: [20] }, t: { values: ['2022', '2023'] } }
			})
		).toBe('PointSeries');
	});
	it('infers VerticalProfile', () => {
		expect(
			inferDomainType({
				type: 'Domain',
				axes: {
					x: { values: [10] },
					y: { values: [20] },
					t: { values: ['2021'] },
					z: { values: [10, 20] }
				}
			})
		).toBe('VerticalProfile');
		expect(
			inferDomainType({
				type: 'Domain',
				axes: {
					x: { values: [10] },
					y: { values: [20] },
					t: { values: ['2021'] },
					z: { start: 20, stop: 21, num: 1 }
				}
			})
		).toBe('VerticalProfile');
	});
});

describe('axis bounds calculations', () => {
	describe('Simple axis bounds', () => {
		describe('number axis', () => {
			it('returns bound values +-1 for one el array', () => {
				expect(calcNumAxisBounds([1])).toEqual([0, 2]);
			});
			it('bounds for 2 value array', () => {
				expect(calcNumAxisBounds([2, 4])).toEqual([1, 3, 3, 5]);
			});
			it('bounds for 3+ value array', () => {
				expect(calcNumAxisBounds([2, 4, 7])).toEqual([1, 3, 3, 5.5, 5.5, 8.5]);
			});
		});
	});
});

describe.skip('tIndicesOfNearest', () => {
	it('Returns correct indices for values of inconsistent formats', () => {
		expect(tIndicesOfNearest(['2021-01-01', '2021-01-02', '2021-01-03'], '2021-01-01')).toEqual([
			2, 2
		]);
		expect(
			tIndicesOfNearest(
				['2021-01-01T03:00:00+03:00', '2021-01', '2021-01-01'],
				'2021-01-01T00:00:00Z'
			)
		).toEqual([0, 0]);
	});
});
