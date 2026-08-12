import type { Domain } from 'coveragejson';
import { inferDomainType } from './utils.ts';
import type { InferDomainClass } from './types.d.ts';
import { Grid } from './grid.ts';
import { Section, Trajectory } from './moving-domain.ts';
import { MultiPoint, MultiPointSeries } from './multipoint.ts';
import { Point, PointSeries, VerticalProfile } from './point.ts';
import { Polygon, PolygonSeries, MultiPolygon, MultiPolygonSeries } from './polygon.ts';
import { load } from '../load.ts';
export * from './base-domain.ts';
export * from './moving-domain.ts';
export * from './multipoint.ts';
export * from './point.ts';
export * from './polygon.ts';
export * from './grid.ts';
export * from './utils.ts';
export type * from './types.d.ts';
export function getDomain<D extends Domain = Domain>(domain: D): InferDomainClass<D>;
export function getDomain<D extends Domain = Domain>(domain: string): Promise<InferDomainClass<D>>;
export function getDomain<D extends Domain = Domain>(domain: D | string) {
  if (typeof domain === 'string') {
    return load<D>(domain).then((dom) => getDomain(dom));
  }
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
