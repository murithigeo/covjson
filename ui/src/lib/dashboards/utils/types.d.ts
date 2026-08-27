import type maplibregl from 'maplibre-gl';
import type { Map } from 'leaflet';
import { type OnIndicesChange, Coverage, CoverageCollection } from '@murithigeo/covjson-core';
import type { MetadataRenderProps } from '../types.d.ts';
import type { Snippet } from 'svelte';
export interface DashboardProps extends PartialBy<MetadataRenderProps<Coverage[]>, 'data'> {
	/**
	 * Point this to the layer's onIndicesChange func
	 */
	onIndicesChange?: OnIndicesChange;
	children?: Snippet;
	formatters?: {
		temporal?: Formatter<string>;
		elevation?: Formatter<number>;
	};
}
type Formatter<T extends string | number> = (val: T) => T;

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface ChartCustomizationOptions {
	/**
	 * The key is the categoryId and the string is the color
	 * Used to create a gradient as well as a legend
	 */
	categories: Record<string, string>;
}
