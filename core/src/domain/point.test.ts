import { Point, PointSeries } from './point.ts';
import { Referencing } from '../referencing.ts';
import { describe, it, expect } from 'vitest';
import p from '../../../example-data/playground/coverages/point.covjson?raw';
import pseries from '../../../example-data/playground/coverages/pointseries.covjson?raw';

const point = new Point(JSON.parse(p).domain);
const pointseries = new PointSeries(JSON.parse(pseries).domain);
describe('Clone: The clone method returns a completely different object', () => {
	it('returns new Point instance when cloned', async () => {
		const clone = point.clone();
		clone.axes.x.values[0] = 20;
		expect(clone.axes.x.values[0]).not.equals(point.axes.x.values[0]);
	});
	it('returns new PointSeries instance when cloned', () => {
		const clone = pointseries.clone();
		clone.axes.t.values = ['2022'];
		expect(clone.axes.t.values[0]).not.equals(pointseries.axes.t.values[0]);
	});
});

describe('reproject: Actually works', async () => {
	const referencing = await Referencing.load({ crsId: 'EPSG:32737' }, []);
	describe('Point', () => {
		const utmPoint = point.clone().reproject(referencing, true);
		it('returns a clone', () => {
			expect(utmPoint.geometry.coordinates).not.toEqual(point.geometry.coordinates);
		});
		it('correctly reprojects', () => {
			expect(utmPoint.geometry.coordinates).toEqual(
				referencing.crs(point.geometry.coordinates as [number, number])
			);
		});

		it.skip('mutates and sets the referencing property', () => {});
	});
});
