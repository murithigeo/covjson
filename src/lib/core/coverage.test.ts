import { describe, it, expect } from 'vitest';
import { Coverage } from './coverage.ts';

describe('Reprojections', async () => {
	const cov = await Coverage.load('https://covjson.org/playground/coverages/grid-tiled.covjson');
	const clone = await cov.clone().reproject({ crsId: 'EPSG:32738' });
	it('Replaces the connection object', () => {
		expect(
			clone.domain.referencing?.find((e) => e.coordinates.some((el) => ['x', 'y'].includes(el)))
				?.system.id
		).toBe('http://www.opengis.net/def/crs/EPSG/0/32738');
	});
	it('#getter referencing returns the replaced referencing object', () => {
		expect(clone.referencing).toBeDefined();
	});
});

describe('Ranges: High load tests', async () => {
	const cov = await Coverage.load<CoverageJSON.Grid>(
		'https://covjson.org/playground/coverages/grid-tiled.covjson'
	);
	it('Loaded Tiled Ranges are persisted in the map', async () => {
		await cov.getData(new Map().set('x', 0));

		expect(cov.ranges.get('FOO')!._ndarr.get(0, 0, 0, 0)).toBe(1);
	});
	it('.queryIndices: Fast and accurate', () => {
		expect(Object.fromEntries(cov.queryIndices([-100, 50]))).toMatchObject({ x: 0, y: 4, t: 0 });
	});
	it('.getData from TileSets', async () => {
		await expect(cov.getData([-100, -50], { ranges: ['FOO'] })).resolves.toMatchObject({
			FOO: 1
		});
		await expect(cov.getData([100, 50], { ranges: ['FOO'] })).resolves.toMatchObject({
			FOO: 50
		});
	});
	describe('.query', async () => {
		const data = await cov.query(cov.indices, { axisNames: { x: { start: 1 }, y: true, t: [1] } });
		it('axisNames: true/false config', () => {
			expect(new Set(data.map((d) => d.y)).size).toBe(cov.domain.axesSize.get('y'));
		});
		it('axisNames: start/stop config', () => {
			expect([...new Set(data.map((d) => d.x))].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		});

		it('axisNames: specific indices', () => {
			expect([...new Set(data.map((d) => d.t))]).toEqual([1]);
		});
	});
});

describe('GeoJSON Mappings', async () => {
	const cov = await Coverage.load('https://covjson.org/playground/coverages/grid-tiled.covjson');
	it.skip('the properties object is the class itself', () => {
		// Maplibre refused?
		expect(cov.feature.properties).toBeInstanceOf({
			domainType: 'Grid',
			uuid: cov.uuid
		});
	});
});
