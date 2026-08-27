import { minMax, NdArray, Parameter } from '@murithigeo/covjson-core';
import { getRandomColor } from '$lib/utils.js';
/**
 * Summary statistics of the Parameter
 * Calculated against currently loaded data and the expected totalSize of previous and currently loaded parameters
 */
interface RangeStatistics {
	/**
	 * Smallest value recorded
	 * Always null for "string" NdArrays
	 * @default null
	 */
	min?: number | null;
	/**
	 * Largest value recorded
	 * Always null for "string" NdArrays
	 * @default null
	 */
	max?: number | null;
	/**
	 * Average of values
	 * Always null for "string" NdArrays
	 * @default null
	 */
	mean?: number | null;
	/**
	 * Median of data
	 * Always null for "string" NdArrays
	 */
	median?: number | null | string;
	/**
	 * Only the first range is checked
	 */
	dataType?: 'string' | 'float' | 'integer';
}

interface RangeSummary extends RangeStatistics {
	/**
	 * The color to be used for this parameter in charts and the basis for gradient
	 */
	color: string;
	/**
	 * The string to display when hovering over data in chart
	 * @default key
	 */
	label: string;
	/**
	 * The key for the parameter
	 */
	key: string;
}

// todo add button to toggle between local stats and global stats
export function getParameterStatistics(
	param: Parameter | string,
	data: Map<string, NdArray>,
	stats?: RangeSummary
): RangeSummary {
	stats = stats || {
		color: getRandomColor(),
		label: typeof param === 'string' ? param : param.label.query()?.value || param.key,
		key: typeof param === 'string' ? param : param.key
	};
	Object.assign(stats, getCoverageStats(data.values().toArray()));
	return stats;
}

export function getCoverageStats(ranges: NdArray[]): RangeStatistics {
	const stats: RangeStatistics = {};
	if (!ranges.length) return stats;

	[{ dataType: stats.dataType }] = ranges;

	let data = ranges.flatMap((v) => v.ndarr.data);
	const totalSize = ranges.reduce((l, r) => l + r.totalSize, 0);

	let medianIndex: [number, number] | number = (totalSize - 1) / 2;
	if (medianIndex % 1 !== 0) {
		medianIndex = Math.trunc(medianIndex);
		medianIndex = [medianIndex, medianIndex + 1];
	}
	if (stats.dataType === 'string') {
		data = data.map((v) => v as string | null).sort((a, b) => String(a).localeCompare(String(b)));
		stats['median'] = Array.isArray(medianIndex) ? null : data[medianIndex];
	} else {
		const values = data.map((v) => v as number | null).sort((a, b) => Number(a) - Number(b)) as (
			number | null
		)[];
		[stats.min, stats.max] = minMax(values);
		let median: number | null;
		if (Array.isArray(medianIndex)) {
			median =
				medianIndex
					.map((i) => values[i])
					.filter((v) => typeof v === 'number')
					.reduce((l, r) => l + r, 0) / 2;
		} else median = values[medianIndex];
		stats['median'] = median;
		stats['mean'] = values.filter((v) => v !== null).reduce((l, r) => l + r, 0) / totalSize;
	}
	return stats;
}
