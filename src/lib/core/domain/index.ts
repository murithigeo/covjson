import type { Domain } from 'coveragejson';
import { inferDomainType } from './utils.js';
import type { InferDomainClass } from './types.js';
import { Grid } from './grid.js';
import { Trajectory } from './trajectory.js';
import { MultiPoint, MultiPointSeries, Section } from './multipoint.js';
import { Point, PointSeries, VerticalProfile } from './point.js';
import { Polygon, PolygonSeries, MultiPolygon, MultiPolygonSeries } from './polygon.js';
export * from './base-domain.js';
export * from './trajectory.js';
export * from './multipoint.js';
export * from './point.js';
export * from './polygon.js';
export * from './grid.js';
export * from './utils.js';
export type * from './types.js';

export function getDomain<D extends Domain = Domain>(domain: D): InferDomainClass<D>;
export function getDomain<D extends Domain = Domain>(domain: D) {
	domain.domainType = domain.domainType || inferDomainType(domain);
	switch (domain.domainType) {
		case 'Grid':
			return new Grid(domain);
		case 'Trajectory':
			return new Trajectory(domain);
		case 'Point':
			return new Point(domain);
		case 'PointSeries':
			return new PointSeries(domain);
		case 'MultiPoint':
			return new MultiPoint(domain);
		case 'MultiPointSeries':
			return new MultiPointSeries(domain);
		case 'Polygon':
			return new Polygon(domain);
		case 'PolygonSeries':
			return new PolygonSeries(domain);
		case 'MultiPolygon':
			return new MultiPolygon(domain);
		case 'MultiPolygonSeries':
			return new MultiPolygonSeries(domain);
		case 'VerticalProfile':
			return new VerticalProfile(domain);
		case 'Section':
			return new Section(domain);
		default:
			throw Error(`Does not custom domain:${domain}`);
	}
}
