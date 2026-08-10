import type { Coverage, DataRow } from '@murithigeo/covjson-core';

export default function (coverage?: Coverage, pageWith: 'z' | 't' = 't') {
	if (!coverage) return undefined;
	const { axesCount: limits } = coverage;

	// For Grids, the scenario is simple.
	// By paging with, say "z", then we get all values for the non "z" dimension since the "z" indices are pages and don't wanna load all the pages at once
	// However, taking into account that non Grid domains may also be tiled, the complexity increases.
	// So it's best to design data fetching scenarios for each domain separately

	// Remember not to include spatial components because having {composite:[.....arrrays],POTM:10} is really awkward
	let nonTiled: 'z' | 't' = 't'; // The dimension that all values will be preloaded for

	switch (coverage.domain.domainType) {
		case 'Grid':
			if (pageWith === 'z') nonTiled = 't';
			else nonTiled = 'z';
			break;
		case 'Trajectory': // All have a separate z axis
		case 'Section':
		case 'VerticalProfile':
			nonTiled = 'z';
			break;
		default:
			nonTiled = 't';
	}
	const frikices = [...Array(coverage.axesCount.get(nonTiled)).keys()];
	return (indices: Map<string, number>, parameters?: string[]): Promise<DataRow[]> => {
		const indices_ = frikices
			.map((x) => new Map(indices).set(nonTiled, x))
			.map((indices) => coverage.getData(indices, parameters))
			.map(async (value, idx) => ({ ...value, [nonTiled]: coverage[nonTiled][idx] })); // Does not account for grid
	};
}
