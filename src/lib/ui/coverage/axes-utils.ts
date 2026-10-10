import { type InferDomainClass } from '#lib/core/index.js';
import type { Axis, AxisConfig, ChartDimensions } from './types';

export default function (domain: ReturnType<InferDomainClass['denormalize']> | InferDomainClass) {
	const conf = new Map<ChartDimensions, Axis>([['x', 't']]);
	switch (domain.domainType) {
		case 'Grid':
			if (domain.t.length) conf.set('y1', 'z');
			conf.set('x', 'z').set('y1', 't');
			conf.set('fx', 'x').set('fy', 'y');
			break;
		case 'Section':
			conf.set('x', 'z').set('fx', 'composite');
			break;
		case 'Trajectory':
			conf.set('x', 'composite');
			break;
		case 'MultiPolygonSeries':
		case 'PolygonSeries':
			conf.set('fx', 'composite');
			if (domain.axes.z) conf.set('y1', 'z');
			break;
		case 'MultiPointSeries':
			conf.set('fx', 'composite');
			break;
		case 'MultiPolygon':
		case 'Polygon':
			if (domain.axes.t) conf.set('x', 't');
			else if (domain.axes.z) conf.set('x', 'z');
			else conf.set('x', 'composite');

			let dx = conf.get('x');
			if (dx === 't' && domain.axes.z) conf.set('y1', 'z');
			else if (dx === 'z' && domain.axes.t) conf.set('y1', 't');
			dx = conf.get('x');
			if (dx !== 'composite') conf.set('fx', 'composite');
			break;
		case 'VerticalProfile':
			conf.set('x', 'z');
			break;
		// Better way to handle 1D values
		case 'Point':
			break;
		case 'PointSeries':
			conf.set('x', 't');
			break;
	}
	return conf;
}
