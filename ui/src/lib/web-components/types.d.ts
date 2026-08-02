import type { ClassValue } from 'clsx';
import type { ChartConfig } from '../components/ui/chart/index.ts';
import type { BarChartProps as BarChartAttrs, LineChartProps as LineChartAttrs } from 'layerchart';
import type { ComponentProps } from 'svelte';
/**
 * How to render properties such as locale objects.
 * "full" means rendering every single locale value.
 * "simple" means rendering one locale. Perfect for limited screen real estate
 * @todo add option to specify which locales to render
 */
export type MetadataRenderDetail = 'simple' | 'full';

export interface MetadataRenderProps<T> {
	data: T;
	/**
	 * Default to simple
	 */
	detail?: MetadataRenderDetail;
	/**
	 *
	 */
	class?: ClassValue;
}

type DataValue = string | number;
interface DataRow<T extends DataValue = DataValue> {
	[range: string]: T | null | undefined;
	z?: number;
	t?: string;
}

interface BaseChartProps<T extends DataValue = DataValue> {
	config: ChartConfig;
	/**
	 * If provided, then it means that the data is not condensed into a single chart
	 * If not, data is coalesced into a single chart where the x-axis will be t and the values may be stacked or grouped
	 */
	pageWith?: 'z' | 't';
}

export interface BarChartProps extends BarChartAttrs<DataRow<number>> {
	pageWith?: 'z' | 't';
	config: ChartConfig;
}

export interface LineChartProps extends LineChartAttrs<DataRow<number>> {
	pageWith?: 'z' | 't';
	config: ChartConfig;
}

/**
 * The parameter key and its toggle state
 */
export type ParameterToggleEventDetail = Record<string, boolean>;
