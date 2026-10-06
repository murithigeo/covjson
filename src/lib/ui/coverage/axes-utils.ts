import {
	type WithRequiredProperty,
	type InferDomainClass,
	CustomDate,
	MultiPoint,
	Polygon,
	Section,
	type DataRow,
	isUndefined,
	isNull
} from '#lib/core/index.ts';
import { downloadImage, type ChartImageOptions } from 'layerchart';

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
export type DenormalizedDomain = ReturnType<InferDomainClass['denormalize']>;
export function resolveAxisIdx(
	domain: DenormalizedDomain,
	axis: Axis,
	idx: number
): string | number | (Polygon | MultiPoint | Section)['axes']['composite']['values'][number] {
	if (axis === 'z' || axis === 't') return domain[axis][idx];
	// @ts-expect-error domain is denormalized
	return domain.axes[axis]?.values[idx];
}
export function resolveAxisIdxForChart(
	domain: DenormalizedDomain,
	axis: Axis,
	idx: number
): number | CustomDate {
	let value = resolveAxisIdx(domain, axis, idx);
	if (Array.isArray(value)) {
		if (typeof value[0] === 'string') value = value[0];
		else value = idx;
		/// Others resolve to an object with {axis,idx} so that we resolve in tooltip
	}
	if (typeof value === 'string') return new CustomDate(value);
	return value;
}

export interface DownloadOptions {
	axisNames: string[];
	categoric?: boolean;
	format?: 'csv' | ChartImageOptions['format'];
	filename: string;
	ref?: HTMLElement;
}
export function download(data: DataRow[], options: DownloadOptions) {
	if (options.format !== 'csv') {
		if (!options.ref) return;
		return downloadImage(options.ref, { format: options.format, filename: options.filename }); //.then(()=>legend = false)
	}
	const header = [...options.axisNames, 'value'];
	if (options.categoric) header.push('category');
	/**
	 * https://stackoverflow.com/a/31536517
	 */
	const str = [
		header.join(','),
		...data.map((row) =>
			header.map((fieldName) => {
				let value: unknown = row[fieldName];
				//@ts-expect-error fieldName should Axis
				if (axisNames.includes(fieldName)) value = resolveAxisIdx(fieldName, value);
				return JSON.stringify(value, (k, v) => {
					if (isUndefined(v)) return 'undefined';
					if (!isNull(v)) return 'null';
					if (Array.isArray(v)) return `${v}`;
					return v;
				});
			})
		)
	].join('\r\n');
	const blob = new Blob([str], { type: 'text/csv;charset=utf-8' });
	const container = document.createElement('a');
	container.href = URL.createObjectURL(blob);
	container.download = options.filename + '.csv';
	container.click();
	container.remove();

	setTimeout(() => URL.revokeObjectURL(container.href), 0);
}
