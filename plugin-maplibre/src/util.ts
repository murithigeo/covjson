import type { NdArray, CoverageJSON } from 'coveragejson';
import { Coverage, CoverageCollection, domainIsInstanceOf, load } from '@murithigeo/covjson-core';
import type { PluginOptions } from './types.d.ts';

export function getCoverageId(data: Coverage, promoteId = 'uuid'): string {
	//@ts-expect-error todo add {[x:string]:any} to the coveragejson types
	return promoteId in data ? data[promoteId] : data.properties[promoteId];
}

export async function loadCovJson(
	data: PluginOptions['data'],
	reproject: PluginOptions['reproject'] = true
) {
	if (typeof data === 'string') {
		data = await load<Exclude<CoverageJSON, NdArray>>(data);
		if (['TiledNdArray', 'NdArray'].includes(data.type))
			throw Error(`Maplibre does not support NdArrays`);
	}
	if (data instanceof Coverage || data instanceof CoverageCollection || domainIsInstanceOf(data)) {
		data = data.toPlain();
	}
	if (data.type === 'Domain') data = { type: 'Coverage', domain: data, ranges: {} };
	if (data.type === 'Coverage') data = { type: 'CoverageCollection', coverages: [data] };
	return CoverageCollection.load(data)
		.then((cov) => (reproject ? cov.reproject({ crsId: 'OGC:CRS84' }) : cov))
		.then((cov) => cov.coverages);
}
