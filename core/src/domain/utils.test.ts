import { describe, expect, it } from 'vitest';
import {
	regularNumToValuesAxis,
	inferDomainType,
	normalizeNumAxis,
	numListIsRegular,
	tListIsRegular,
	parseDateString,
	calcNumAxisBounds,
	calcStrAxisBounds,
	tIndicesOfNearest
} from './utils.ts';

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
	describe('#tListIsRegular', () => {
		it('Returns true if t values are regularly spaced', () => {
			expect(tListIsRegular(['2021', '2022', '2023'])).toBeTruthy();
			expect(tListIsRegular(['2021-01-01', '2021-02-01', '2021-03-04'])).toBeTruthy();
			expect(
				tListIsRegular(['2026-01-02T13:00:00Z', '2026-01-03T13:00:00Z', '2026-01-04T13:00:00Z'])
			).toBeTruthy();
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
	describe.skip('tuple axis bounds', () => {});
	describe.skip('Polygon axis bounds', () => {});
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

		describe.skip('string axis', () => {
			it('returns year+- when given year string', () => {
				expect(calcStrAxisBounds(['2021'])).toEqual(['2020', '2022']);
			});
			it('returns month+- when given year-month', () => {
				expect(calcStrAxisBounds(['2021-01'])).toEqual(['2020-12', '2021-02']);
			});
			it('returns day+- when given date', () => {
				expect(calcStrAxisBounds(['2021-01-01'])).toEqual(['2020-12-31', '2021-01-02']);
			});
			it('');
		});
	});
});

describe('Date[time] detection', () => {
	it('Returns Year for YYYY', () => {
		expect(parseDateString('2021')).toStrictEqual({
			format: 'Year',
			year: 2021,
			month: undefined,
			day: undefined,
			offset: undefined,
			hour: undefined,
			minute: undefined,
			second: undefined
		});
	});
	it('Returns Year-Month for YYYY-MM', () => {
		expect(parseDateString('2021-10')).toStrictEqual({
			format: 'YearMonth',
			year: 2021,
			month: 10,
			day: undefined,
			offset: undefined,
			hour: undefined,
			minute: undefined,
			second: undefined
		});
	});
	it('Returns YYYY-MM-DD for YYYY-MM-DD', () => {
		expect(parseDateString('2021-01-01')).toStrictEqual({
			format: 'Date',
			year: 2021,
			month: 1,
			day: 1,
			offset: undefined,
			hour: undefined,
			minute: undefined,
			second: undefined
		});
	});
	it('Returns TimeStamp for timestamps', () => {
		expect(parseDateString('2021-01-10T13:13:27.78Z')).toStrictEqual({
			format: 'Instant',
			year: 2021,
			month: 1,
			day: 10,
			hour: 13,
			minute: 13,
			second: 27.78,
			offset: '+00:00'
		});
	});
});

describe.skip('tIndicesOfNearest', () => {
	it('Returns correct indices for values of inconsistent formats', () => {
		expect(
			tIndicesOfNearest(['2021-01-01', '2021-01-02',"2021-01-03"], '2021-01-01')
		).toEqual([2, 2]);
		expect(
			tIndicesOfNearest(
				['2021-01-01T03:00:00+03:00', '2021-01', '2021-01-01'],
				'2021-01-01T00:00:00Z'
			)
		).toEqual([0, 0]);
	});
});
