import { describe, it, expect } from 'vitest';
import { MultiPoint } from './multipoint.js';

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
