import { describe, it, expect } from 'vitest';
import { Coverage } from '../src/coverage.ts';

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
  const cov = await Coverage.load('https://covjson.org/playground/coverages/grid-tiled.covjson');
  describe('Grid', () => {
    it('persists the newly loaded data in the map', async () => {
      const data = await cov.getData(new Map().set('x', 0));

      expect(cov.ranges.get('FOO')!.ndarr.get(0, 0, 0, 0)).toBe(1);
    });
    it('.queryIndices: Fast and accurate', () => {
      expect(cov.queryIndices([-100, 50])).toEqual(new Map().set('x', 0).set('y', 4).set('t', 0));
    });
    it('.queryData from TileSets', async () => {
      await expect(cov.getData([-100, -50], ['FOO'])).resolves.toMatchObject({
        FOO: 1
      });
      await expect(cov.getData([100, 50], ['FOO'])).resolves.toMatchObject({
        FOO: 50
      });
    });
  });
});

describe('GeoJSON Mappings', async () => {
  const cov = await Coverage.load('https://covjson.org/playground/coverages/grid-tiled.covjson');
  it('the properties object is the class itself', () => {
    expect(cov.feature.properties).toEqual({
      domainType: 'Grid',
      uuid: cov.uuid
    });
  });
});
