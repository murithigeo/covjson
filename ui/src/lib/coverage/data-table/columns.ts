import { createColumnHelper } from '@tanstack/svelte-table';
import type { DataTableFeatures } from './features.js';
import type { DataRow } from '@murithigeo/covjson-core';

const columnHelper = createColumnHelper<DataTableFeatures, DataRow>();

export function getColumns(axisLayout: Map<string, number>) {
	const sort = axisLayout
		.entries()
		.toArray()
		.sort((a, b) => a[1] - b[1])
		.map(([axisName]) => axisName);
	return columnHelper.columns(
		sort.map((axis) =>
			columnHelper.accessor(
				(row) => {
					if (['z', 't'].includes(axis)) return row[axis];
					return row[axis + 'Index'];
				},
				{ header: `axis:${axis}`, spanRows: true }
			)
		)
	);
}
export const columns = columnHelper.columns([]);
