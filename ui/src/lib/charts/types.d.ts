type DataType = string | number;
import { ChartConfig } from '../components/ui/chart/index.ts';
import type { BarChart } from 'layerchart';

/**
 * Indicates that data is part of the series
 * z,t are reserved values
 */
export interface SeriesDataRow<T extends DataType = DataType> extends StaticDataRow<T> {
	z?: number;
	t?: string;
}

/**
 * Data from Polygons, Points is supposed to be this
 */
export interface StaticDataRow<T extends DataType = DataType> {
	[rangeName: string]: T | null | undefined;
}

export interface ChartComponentProps<T> {
	data: T[];
	config: ChartConfig;
	parameters?: SvelteSet<string>;
	legend?: boolean;
}

type BarChartProperties = ComponentProps<typeof BarChart>;
type SelectBarChartProps = Omit<BarChartProperties, 'data' | 'series'>;
export interface BarChartProps extends ChartComponentProps<SeriesDataRow>, SelectBarChartProps {
	/**
	 * Stack by the paging factor
	 */
	x?: 'z' | 't';
}

export type SeriesChartProps = ChartComponentProps<SeriesDataRow>;
