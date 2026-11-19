import { CustomDate, Coverage } from '#lib/core/index.ts';
import { SvelteMap } from 'svelte/reactivity';
import type { Axis, CoverageOptions, AxisResolver, ChartDimension, Formatters } from '../types';

/**
 * @param coverage A Coverage whose axes values are no longer normalized
 */
export function axisIdxResolver(cov: Coverage, resolver?: Formatters['axis']): AxisResolver {
	const domain = cov.domain.clone().denormalize();
	return (axisName: Axis, idx: number, mode?: 'chart') => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const axis: undefined | any = domain.axes[axisName as keyof (typeof domain)['axes']];
		if (!axis) return '';

		let dataType = axis.dataType || 'primitive';
		let value = axis.values[idx];

		if (dataType === 'primitive') {
			if (typeof value === 'string' && mode === 'chart') return new CustomDate(value);
			return value;
		}
		if (resolver) return resolver(domain.domainType, idx, { mode, value, axisName });
		if (dataType === 'tuple') {
			if (typeof value[0] === 'string' && mode === 'chart')
				[dataType, value] = ['primitive', value[0]];
		}

		if (mode === 'chart') {
			if (dataType === 'polygon') return `polygon @ index: ${idx}`;
			return `(${value.join(',')})`;
		}

		return JSON.stringify(value, null, 2);
	};
}

export function getAxisConfig(coverage: Coverage) {
	const config: CoverageOptions['config'] = {};
	const setDimension = (dim: ChartDimension, axis: Axis) => {
		const size = coverage.axesSize.get(axis as never);
		if (!size) return { setDimension };
		config[dim] = axis;
		return { setDimension };
	};
	switch (coverage.domainType) {
		case 'Grid':
			setDimension('x', coverage.t.length ? 't' : 'z').setDimension(
				'series',
				coverage.t.length ? 'z' : 't'
			);
			break;
		case 'Section':
			setDimension('x', 'z').setDimension('series', 'composite');
			break;
		case 'Trajectory':
			setDimension('x', 'composite').setDimension('series', 'z');
			break;
		case 'VerticalProfile':
			setDimension('x', 'z');
			break;
		case 'MultiPolygonSeries':
		case 'PolygonSeries':
		case 'MultiPointSeries':
		case 'PointSeries':
			setDimension('x', 't');
			if (coverage.domainType !== 'PointSeries') setDimension('series', 'composite');
			break;
		case 'MultiPolygon':
		case 'Polygon':
			setDimension('x', coverage.t.length ? 't' : coverage.z.length ? 'z' : 'composite');
			break;
		case 'Point':
			setDimension('x', coverage.t.length ? 't' : 'z');
			break;
		case 'MultiPoint':
			setDimension('x', coverage.t.length ? 't' : 'composite');
	}

	return {
		config,
		axisNames: Object.values(config).reduce(
			(l: NonNullable<CoverageOptions['axisNames']>, r) => ({ ...l, [r]: true }),
			{}
		)
	};
}

export function makeIndicesReactive(cov: Coverage) {
	cov.indices = new SvelteMap(cov.indices);
}

class Box {
	value = $state(new Map<string, number>());
	constructor(value: Map<string, number>) {
		value.forEach((v, k) => value.set(k, v));
	}
}

export function makeCoverageIndicesReactive(cov: Coverage) {
	const indices = new Box(cov.indices);
	Object.defineProperty(cov, 'indices', {
		get: () => indices.value,
		set: (v) => {
			indices.value = v;
		},
		configurable: true,
		enumerable: true
	});
	return cov;
}

/**
 *
 * @param vals Should be sorted
 */
export function calculateMedian<T extends string | number>(vals: Array<T>): T | null {
	let index: [number, number] | number = Math.floor(vals.length / 2);
	if (index % 2 === 0) index = [index, index - 1];
	if (Array.isArray(index)) {
		const [a, b] = [vals[index[0]], vals[index[1]]];
		if (typeof a === 'string') return null;
		return (((a as number) + (b as number)) / 2) as T;
	}
	return vals.at(index) ?? null;
}

// Source - https://stackoverflow.com/a/1484514
// Posted by Anatoliy, modified by community. See post 'Timeline' for change history
// Retrieved 2026-08-20, License - CC BY-SA 3.0

export function getRandomColor() {
	const letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
