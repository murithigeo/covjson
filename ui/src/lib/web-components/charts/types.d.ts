import type { BarChartProps as BarChartAttrs, LineChartProps as LineChartAttrs } from 'layerchart';
import { type DataValue, type DataRow } from '@murithigeo/covjson-core';
import type { ChartConfig } from '../components/ui/chart/index.ts';

interface BaseChartProps {
	selected: SvelteSet<string>;
}

export type BarChartProps = BaseChartProps & BarChartAttrs<DataRow>;
export type LineChartProps = BaseChartProps & LineChartAttrs<DataRow>;
