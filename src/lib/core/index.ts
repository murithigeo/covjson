import { Coverage } from './coverage.js';
import type { CoverageJSON, Domain, NdArray, TiledNdArray } from 'coveragejson';
import { CoverageCollection } from './coverage-collection.js';
import { getDomain } from './domain/index.js';
import { Range } from './ranges.js';
import type { CoverageOptions, RangeOptions } from './types.js';
export * from './coverage.js';
export * from './coverage-collection.js';
export * from './domain/index.js';
export * from './parameters.js';
export * from './referencing.js';
export * from './ranges.js';
export * from './load.js';
export * from './utils.js';
export * from './error.js';
export type * from './types.js';

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

export type DenormalizedCoverage<D extends Domain = Domain> = ReturnType<
	Coverage<D>['denormalize']
>;
/**
 * A function to be called when the current indices on the coverage change.
 * For integrating UI with mapping libraries i.e. to change view of the map or to highlight the clicked axis values
 */
export type OnIndicesChange = (
	coverage: Coverage | DenormalizedCoverage,
	indices: Map<string, number>
) => void;
