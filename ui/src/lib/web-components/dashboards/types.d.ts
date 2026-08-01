import type maplibregl from 'maplibre-gl';
import type { Map } from 'leaflet';
import { type onIndicesChange, Coverage } from '@murithigeo/covjson-core';
import type { MetadataRenderProps } from '../types.d.ts';
import type { Snippet } from 'svelte';
export interface DashboardProps extends PartialBy<MetadataRenderProps<Coverage>, 'data'> {
	/**
	 * Point this to the layer's onIndicesChange func
	 */
	onIndicesChange: OnIndicesChange;
	children?: Snippet;
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
