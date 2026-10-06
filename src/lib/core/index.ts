import { Coverage, type CoverageOptions } from './coverage.ts';
import type { CoverageJSON, Domain, NdArray, TiledNdArray } from 'coveragejson';
import { CoverageCollection } from './coverage-collection.ts';
import { getDomain } from './domain/index.ts';
import { Range, type RangeOptions } from './ranges.ts';
export * from './coverage.ts';
export * from './coverage-collection.ts';
export * from './domain/index.ts';
export * from './parameters.ts';
export * from './referencing.ts';
export * from './ranges.ts';
export * from './load.ts';
export * from './utils.ts';
export * from './error.ts';

export default function getCoverageJson<T extends CoverageJSON>(
	doc: T,
	options?: T extends NdArray ? RangeOptions : CoverageOptions
) {
	switch (doc.type) {
		case 'Domain':
			return getDomain(doc);
		case 'CoverageCollection':
			return CoverageCollection.load(doc, options as CoverageOptions);
		case 'Coverage':
			return Coverage.load(doc, options as CoverageOptions);
		case 'NdArray':
			return new Range(doc, options as RangeOptions);
		case 'TiledNdArray':
			return new Range<string | number, TiledNdArray>(doc, options as RangeOptions);
	}
}

/**
 * A function to be called when the current indices on the coverage change.
 * For integrating UI with mapping libraries i.e. to change view of the map or to highlight the clicked axis values
 */
export type OnIndicesChange = (
	coverage: Coverage | ReturnType<Coverage['denormalize']>,
	indices: Map<string, number>
) => void;
