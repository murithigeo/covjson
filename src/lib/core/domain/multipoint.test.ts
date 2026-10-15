import { describe, it, expect } from 'vitest';
import type { Coverage, MultiPoint as MP } from 'coveragejson';
import { MultiPoint } from './multipoint.ts';
import { load } from '../load.ts';

const multipoint = new MultiPoint({
	type: 'Domain',
	domainType: 'MultiPoint',
	axes: {
		composite: {
			values: [
				[36, 1, 0],
				[0, 0, 0]
			],
			dataType: 'tuple',
			coordinates: ['x', 'y', 'z']
		}
	}
});
describe('MultiPoint tests', async () => {
	describe('.queryIndices', () => {
		it('Returns the composite index of the point closest', () => {
			expect(Object.fromEntries(multipoint.queryIndices([-5.1, -40.2]))).toMatchObject({
				composite: 1
			});
		});
	});
	describe.skip('.collect tests');
});
