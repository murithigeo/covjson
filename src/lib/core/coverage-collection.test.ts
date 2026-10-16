import { describe, expect, it } from 'vitest';
import { CoverageCollection, load } from './index.ts';
import type { CoverageCollection as CovColl } from 'coveragejson';
import { Coverage } from './coverage.ts';
const data = load<CovColl>('https://covjson.org/playground/coverages/point-collection.covjson');

describe('Referencing', async () => {
	const v0 = await (await CoverageCollection.load(await data)).reproject({ crsId: 'OGC:CRS84' });
	it.each(v0.coverages)(
		'Reprojection: domain.referencing is set to undefined because it is part of collection',
		(cov) => {
			expect(cov.domain.referencing).toBeUndefined();
		}
	);
	it('Expect that the resulting collection has a defined referencing object whose length is 3', () => {
		expect(v0.referencing?.length).toBe(3);
	});
});

describe('Data Retrieval', async () => {
	const v1 = await CoverageCollection.load(await data);
	v1.coverages.push(
		await Coverage.load({
			type: 'Coverage',
			domain: 'https://covjson.org/playground/coverages/grid-domain-bng.covjson',
			ranges: {}
		})
	);

	it('Is case insensitive', async () => {
		const data = await v1.getData([0, 0], { ranges: ['POTm', 'qc'] });
		const expected = [{ POTM: 23.8, QC: 1 }, { POTM: 21.8, QC: 0 }, {}];
		data.forEach((row, i) => expect(row).toMatchObject(expected[i]));
	});
	it('Returns undefined for non-existent ranges', async () => {
		const expected = [{ POTM: 23.8, QC: 1 }, { POTM: 21.8, QC: 0 }, {}];
		const data = await v1.getData([0, 0], { ranges: ['POTM', 'qc', 'RANDOHM'] });
		data.forEach((row, i) => expect(row).toMatchObject(expected[i]));
	});
});
