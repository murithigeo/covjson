import type { BarChartProps as BarChartAttrs, LineChartProps as LineChartAttrs } from 'layerchart';
import { type DataValue, type DataRow } from '@murithigeo/covjson-core';
import type { ChartConfig } from '../components/ui/chart/index.ts';

interface BaseChartProps {
	config: ChartConfig;
	/**
	 * If provided, then it means that the data is not condensed into a single chart
	 * If not, data is coalesced into a single chart where the x-axis will be t and the values may be stacked or grouped
	 */
	pageWith?: 'z' | 't';
	/**
	 * Whether to show tooltip
	 */
	tooltip?: boolean;
	/**
	 *
	 */
	selected: SvelteSet<string>;
}

export type BarChartProps = BaseChartProps & BarChartAttrs<DataRow<number>>;
export type LineChartProps = BaseChartProps & LineChartAttrs<DataRow<number>>;
