import { NetCDFReader } from 'netcdfjs';
import type { Grid, NdArray } from 'coveragejson';
import { Coverage } from '../core';

const Longitudes = ['Longitude', 'LONGITUDE', 'LON', 'X', 'x'];
const Latitudes = ['Latitude', 'LATITUDE', 'LAT', 'Y', 'y'];
const Times = ['t', 'T', 'Time', 'TIME'];
export default function (v: NetCDFReader) {
	const domain: Grid = {
		type: 'Domain',
		domainType: 'Grid',
		axes: { x: { values: [] }, y: { values: [] }, z: { values: [] }, t: { values: [] } },
		referencing: []
	};

	const ranges: Record<string, NdArray> = {};
	const options: Record<string, Record<'title' | 'unit', string>> = {};

	const lonIdx = v.dimensions.find((d) => Longitudes.indexOf(d.name) !== -1);
	const latIdx = v.dimensions.find((d) => Latitudes.indexOf(d.name) !== -1);
	const lonIdx = v.dimensions.find((d) => Longitudes.indexOf(d.name) !== -1);
	const tIdx = v.dimensions.find((d) => Times.indexOf(d.name) !== -1);

	return { coverage: new Coverage({ type: 'Coverage', domain, ranges }), options };
}
