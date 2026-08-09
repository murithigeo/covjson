import type { NdArray, CoverageJSON } from 'coveragejson';
import {
	BaseDomain,
	Coverage,
	CoverageCollection,
	getDomain,
	load
} from '@murithigeo/covjson-core';
import type { PluginOptions } from './types.d.ts';

export function getCoverageId(data: Coverage, promoteId = 'uuid'): string {
	//@ts-expect-error todo add {[x:string]:any} to the coveragejson types
	return promoteId in data ? data[promoteId] : data.properties[promoteId];
}

export async function loadCovJson(data: PluginOptions['data']): Promise<Coverage[]> {
	if (typeof data === 'string') {
		data = await load<Exclude<CoverageJSON, NdArray>>(data);
		if (['TiledNdArray', 'NdArray'].includes(data.type))
			throw Error(`Maplibre does not support NdArrays`);
	}

	if (data.type === 'Domain') {
		if (!(data instanceof BaseDomain)) data = getDomain(data);
		return [new Coverage({ type: 'Coverage', domain: data, ranges: {} })];
	}
	if (data.type === 'Coverage') {
		if (data instanceof Coverage) return [data];
		return [await Coverage.load(data)];
	}
	if (data instanceof CoverageCollection) return data.coverages;
	return CoverageCollection.load(data).then(({ coverages }) => coverages);
}
