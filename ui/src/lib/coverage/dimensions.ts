import type { WithRequiredProperty, InferDomainClass } from '@murithigeo/covjson-core';

export default function (domain: InferDomainClass): AxisConfig {
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
		case 'MultiPointSeries':
		case 'MultiPolygonSeries':
		case 'PolygonSeries':
			conf.x = 't';
			conf.fx = 'composite';
			break;
		case 'VerticalProfile':
			conf.x = 'z';
			break;
		case 'PointSeries':
			conf.x = 't';
			break;
	}
	return conf;
}

export type AxisConfig = WithRequiredProperty<Partial<Record<'x' | 'y1' | 'fx' | 'fy', Axis>>, 'x'>;

export type Axis = 'x' | 'y' | 'composite' | 'z' | 't';
