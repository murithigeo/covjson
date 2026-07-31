import { Coverage } from './coverage.ts';
import type { CoverageJSON } from 'coveragejson';
import { CoverageCollection } from './coverage-collection.ts';
import { getDomain } from './domain/index.ts';
import { NdArray } from './ranges.ts';
export * from './coverage.ts';
export * from './coverage-collection.ts';
export * from './domain/index.ts';
export * from './parameters.ts';
export * from './referencing.ts';
export * from './ranges.ts';
export * from './load.ts';
export * from './utils.ts';

export default function getCoverageJson<T extends CoverageJSON>(doc: T) {
	switch (doc.type) {
		case 'Domain':
			return getDomain(doc);
		case 'CoverageCollection':
			return CoverageCollection.load(doc);
		case 'Coverage':
			return Coverage.load(doc);
		default:
			return new NdArray(doc);
	}
}

/**
 * A function to be called when the current indices on the coverage change
 * For integrating UI with mapping libraries i.e. to change view of the map or to highlight the clicked axis values
 */
export type OnIndicesChange = (uuid: string, indices: Record<string, number>) => void;
