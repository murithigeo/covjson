import { Grid } from './grid.ts';
import { Section, Trajectory } from './moving-domain.ts';
import { MultiPoint, MultiPointSeries } from './multipoint.ts';
import { Point, PointSeries } from './point.ts';
import { Polygon, PolygonSeries, MultiPolygon, MultiPolygonSeries } from './polygon.ts';
import { VerticalProfile } from './point.ts';
import type {
  Domain,
  Point as P,
  PointSeries as PSeries,
  Polygon as Poly,
  PolygonSeries as PolySeries,
  MultiPoint as MP,
  MultiPointSeries as MPSeries,
  MultiPolygon as MultiPoly,
  MultiPolygonSeries as MultiPolySeries,
  Section as Sect,
  Trajectory as Traj,
  Grid as Gd,
  RegularlySpacedAxis,
  VerticalProfile as VertProfile
} from 'coveragejson';
import type { BaseDomain } from './base-domain.ts';

export type InferDomainClass<D extends Domain> = D extends Gd
  ? Grid
  : D extends Traj
    ? Trajectory
    : D extends P
      ? Point
      : D extends PSeries
        ? PointSeries
        : D extends MP
          ? MultiPoint
          : D extends MPSeries
            ? MultiPointSeries
            : D extends Poly
              ? Polygon
              : D extends PolySeries
                ? PolygonSeries
                : D extends MultiPoly
                  ? MultiPolygon
                  : D extends MultiPolySeries
                    ? MultiPolygonSeries
                    : D extends Sect
                      ? Section
                      : D extends VertProfile
                        ? VerticalProfile
                        : never;

export type MakeDomainTypeRequired<D extends Domain> = D & {
  domainType: NonNullable<D['domainType']>;
};

export type WithoutRegularlySpacedAxis<D extends Domain> = Omit<BaseDomain<D>, 'axes'> & {
  axes: {
    [axisName in keyof BaseDomain<D>['axes']]: Exclude<
      BaseDomain<D>['axes'][axisName],
      RegularlySpacedAxis
    >;
  };
};
