import type maplibregl from 'maplibre-gl';
import type { Map } from 'leaflet';
import { type onIndicesChange, Coverage } from '@murithigeo/covjson-core';

export interface DashboardProps {
	/**
	 * Point this to the layer's onIndicesChange func
	 */
	onIndicesChange: OnIndicesChange;
	coverage: Coverage;
}
