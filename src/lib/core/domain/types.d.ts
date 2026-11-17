import { Grid } from './grid.js';
import { Trajectory } from './trajectory.js';
import { MultiPoint, MultiPointSeries, Section } from './multipoint.js';
import { Point, PointSeries } from './point.js';
import { Polygon, PolygonSeries, MultiPolygon, MultiPolygonSeries } from './polygon.js';
import { VerticalProfile } from './point.js';
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
	Grid as Gd
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
											: VerticalProfile;

export type MakeDomainTypeRequired<D extends Domain> = D & {
	domainType: NonNullable<D['domainType']>;
};
