import { describe, expect, it } from 'vitest';
import { Referencing, type ReferencingOptions } from './referencing';
import { toURI } from '@murithigeo/uriproj';
import type { Position } from 'coveragejson';

const position: Position = [-40.2, -5.1];
const options: ReferencingOptions = { crs: { id: '' } };

describe('crs/conversions always return [lon,lat]', () => {
	const connections = new Referencing([
		{
			coordinates: ['x', 'y'],
			system: { type: 'GeographicCRS' }
		}
	]);
	it(`LatLng to LngLat`, async () => {
		if (options.crs) options.crs.id = 'OGC:CRS84';
		connections[0].system = { type: 'GeographicCRS', id: 'EPSG:4326' };
		await connections.to(options);
		connections.crs(position).forEach((d, i) => expect(d).toBeCloseTo(position.toReversed()[i]));
	});
	it('LatLng to LatLng', async () => {
		options.crs = { id: 'EPSG:4326' };
		connections[0].system = { type: 'GeographicCRS', id: 'EPSG:4327' };
		await connections.to(options);
		connections.crs(position).forEach((d, i) => expect(d).toBeCloseTo(position.toReversed()[i]));
	});
	it('LngLat to LngLat', async () => {
		options.crs = { id: 'OGC:CRS84' };
		connections[0].system = { type: 'GeographicCRS', id: 'EPSG:32737' };
		await connections.to(options);
		connections
			.crs([-14031803.849869838, 6977050.339359542])
			.forEach((d, i) => expect(d).toBeCloseTo(position[i]));
	});
});
// describe('#vrs', () => {
// 	const connections = new Referencing([
// 		{
// 			coordinates: ['z'],
// 			system: {
// 				type: 'GeographicCRS'
// 			}
// 		}
// 	]);
// 	options.vrs = undefined;
// 	it('Referencing assumes that vrs multiplier is 1 if system.id undefined', async () => {
// 		await connections.to(options);
// 		expect(connections.vrsFactor).toBe(1);
// 	});
// 	it('If source is Meters && !vrsId return 1', async () => {
// 		connections[0].system = { id: 'EPSG:5714', type: 'GeographicCRS' };
// 		await connections.to(options);
// 		expect(connections.vrsFactor).toBe(1);
// 	});
// 	it('If source is Ft && !vrsId, multiplier is from source', async () => {
// 		connections[0].system = { id: 'EPSG:5702', type: 'VerticalCRS' };
// 		delete options.vrs;
// 		await connections.to(options);
// 		expect(connections.vrsFactor).toBeCloseTo(0.3048);
// 	});
// 	it('Correct multiplier for Meters-based VRS to Ft-based VRS', async () => {
// 		options.vrs = { id: 'EPSG:5702' };
// 		connections[0].system = { type: 'VerticalCRS', id: 'EPSG:5714' };
// 		await connections.to(options);
// 		expect(connections.vrsFactor).toBeCloseTo(1 / 0.3048);
// 	});
// 	it('correct multiplier for Ft-based VRS to Ft-based VRS', async () => {
// 		options.vrs = { id: 'EPSG:5702' };
// 		connections[0].system = { id: 'EPSG:6130', type: 'VerticalCRS' };
// 		await connections.to(options);
// 		expect(connections.vrsFactor).toBeCloseTo(1);
// 	});
// 	it('Correct multiplier for Ft-based VRS to Meters based VRS', async () => {
// 		options.vrs = { id: 'EPSG:5714' };
// 		connections[0].system = { id: 'EPSG:5702', type: 'VerticalCRS' };
// 		await connections.to(options);
// 		expect(connections.vrsFactor).toBeCloseTo(0.3048);
// 	});
// });

describe('load function', async () => {
	const connections = new Referencing([
		{
			coordinates: ['x', 'y', 'z'],
			system: { type: 'GeographicCRS', id: 'OGC:CRS84h' }
		}
	]);
	await connections.to({
		crs: { id: 'EPSG:32737' },
		vrs: { id: 'EPSG:5773', fn: (v) => v }
	});

	it('replaces the connection object', () => {
		// Also handles the expectation that the coord reference is normalized
		expect(
			connections.find(({ coordinates }) => coordinates.indexOf('x') !== -1)?.system.type
		).toBe('ProjectedCRS');
	});
	it('instantiates vrs,trs,crs connections if none found', () => {
		expect(connections.find((e) => e.system.type === 'VerticalCRS')?.system.id).toBe(
			toURI('EPSG:5773')
		);
	});
	it('replaces the connections array by reference', () => {
		expect(connections.find((d) => d.system.type === 'ProjectedCRS')).toBeDefined();
	});
});
