import { describe, it, expect } from 'vitest';
import mp from '../../../example-data/playground/coverages/multipoint.covjson?raw';
import { MultiPoint } from './multipoint.ts';

const multipoint = new MultiPoint(JSON.parse(mp).domain);
describe('MultiPoint tests', async () => {
	describe('.queryIndices', () => {
		it('Returns the composite index of the point closest', () => {
			expect(multipoint.queryIndices([-5.1, -40.2])).toEqual({ composite: 0 });
		});
	});
	describe.skip('.collect tests');
});
