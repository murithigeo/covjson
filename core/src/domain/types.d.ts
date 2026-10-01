import { Grid } from './grid.ts';
import { Trajectory } from './trajectory.ts';
import { MultiPoint, MultiPointSeries, Section } from './multipoint.ts';
import { Point, PointSeries } from './point.ts';
import { Polygon, PolygonSeries, MultiPolygon, MultiPolygonSeries } from './polygon.ts';
import { VerticalProfile } from './point.ts';
import { BaseDomain } from './base-domain.ts';
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

export type InferDomainClass<D extends Domain = Domain> = D extends Gd
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
                        : BaseDomain;

export type MakeDomainTypeRequired<D extends Domain> = D & {
  domainType: NonNullable<D['domainType']>;
};

export type WithoutRegularlySpacedAxis<
  D extends Domain,
  I extends InferDomainClass<D> = InferDomainClass<D>
> = Omit<I, 'axes'> & {
  axes: {
    [axisName in keyof I['axes']]: Exclude<I['axes'][axisName], RegularlySpacedAxis>;
  };
};
