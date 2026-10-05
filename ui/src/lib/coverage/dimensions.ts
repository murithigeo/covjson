import type { WithRequiredProperty, InferDomainClass } from '@murithigeo/covjson-core';

export default function (
	domain: ReturnType<InferDomainClass['denormalize']> | InferDomainClass
): AxisConfig {
	const conf: AxisConfig = { x: 't' };
	switch (domain.domainType) {
		case 'Grid':
			if (domain.t.length) {
				conf.y1 = 'z';
			} else {
				conf.x = 'z';
				conf.y1 = 't';
			}
			conf.fx = 'x';
			conf.fy = 'y';
			break;
		case 'Section':
			conf.x = 'z';
			conf.fx = 'composite';
			break;
		case 'Trajectory':
			conf.x = 'composite';
			break;
		case 'MultiPolygonSeries':
		case 'PolygonSeries':
			conf.x = 't';
			conf.fx = 'composite';
			if (domain.axes.z) conf.y1 = 'z';
			break;
		case 'MultiPointSeries':
			conf.x = 't';
			conf.fx = 'composite';
			break;
		case 'MultiPolygon':
		case 'Polygon':
			conf.fx = 'composite';
			if (domain.axes.t) conf.x = 't';
			else if (domain.axes.z) conf.x = 'z';
			if (conf.x === 't' && domain.axes.z) conf.y1 = 'z';
			else if (conf.x === 'z' && domain.axes.t) conf.y1 = 't';
			break;
		case 'VerticalProfile':
			conf.x = 'z';
			break;
		case 'Point':
			break;
		case 'PointSeries':
			conf.x = 't';
			break;
	}
	return conf;
}

export interface AxisConfig {
	x: Axis;
	y1?: Extract<Axis, 'z' | 't'>;
	/**
	 * Grid (x), MultiPoint/MultiPolygon/MultiPolygonSeries (Polygon/Point)
	 */
	fx?: Extract<Axis, 'composite' | 'x' | 'y'>;
	fy?: Extract<Axis, 'composite' | 'x' | 'y'>;
}

export type Axis = 'x' | 'y' | 'composite' | 'z' | 't';
