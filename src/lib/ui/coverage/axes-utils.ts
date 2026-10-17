import { CustomDate, type DataRow, type InferDomainClass } from '#lib/core/index.ts';
import type { Axis, AxisResolver } from './types.d.ts';

export default function (domain: ReturnType<InferDomainClass['denormalize']>): {
	x: Axis;
	resolver: AxisResolver;
} {
	let x: Axis;
	switch (domain.domainType) {
		case 'Grid':
			if (domain.t.length) x = 't';
			else x = 'z';
			break;
		case 'Section':
		case 'Trajectory':
		case 'VerticalProfile':
			if (domain.domainType === 'Trajectory') x = 'composite';
			else x = 'z';
			break;
		case 'MultiPolygonSeries':
		case 'PolygonSeries':
		case 'MultiPointSeries':
		case 'PointSeries':
			x = 't';
			break;
		case 'MultiPolygon':
		case 'Polygon':
			if (domain.axes.t) x = 't';
			else if (domain.axes.z) x = 'z';
			else x = 'composite';
			break;
		case 'Point':
			x = 't';
			if (!domain.axes.t) x = 'z';
			break;
		case 'MultiPoint':
			if (domain.axes.t) x = 't';
			else x = 'composite';
	}

	return {
		x: x!,
		resolver: (an, idx, mode) => {
			const axis: undefined | any = domain.axes[an as keyof (typeof domain)['axes']];
			if (!axis) return `NULL`;
			let dataType = axis.dataType || 'primitive';
			let value = axis.values[idx];

			if (dataType === 'tuple') {
				if (typeof value[0] === 'string' && mode === 'chart')
					[dataType, value] = ['primitive', value[0]];
			}
			if (dataType === 'primitive') {
				if (typeof value === 'string' && mode === 'chart') return new CustomDate(value);
				return value;
			}
			if (mode === 'chart') {
				if (dataType === 'polygon') return `polygon @ index: ${idx}`;
				return `(${value.join(',')})`;
			}

			return JSON.stringify(value, null, 2);
		}
	};
}

export function flattenByDimension(rows: DataRow[], axes: Axis[], flattenBy: Axis) {
	const groupAxes = axes.filter((an) => an !== flattenBy);
	const groups = new Map<string, DataRow>();

	for (const r of rows) {
		const key = groupAxes.map((an) => r[an]).join(';');
		let g = groups.get(key);
		if (!g) {
			g = {} as DataRow;
			for (const an of groupAxes) g[an] = r[an];
			groups.set(key, g);
		}
		g[r[flattenBy]!.toString()] = r.value;
	}

	return [...groups.values()];
}
