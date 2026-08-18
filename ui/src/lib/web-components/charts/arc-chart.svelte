<script lang="ts">
	// To be used for single cell data such as Point/MultiPoint/Polygon
	import { type ArcChartProps, ArcChart } from 'layerchart';
	import type { DataRow } from '@murithigeo/covjson-core';

	let { data = $bindable(), series = $bindable(), ...props }: ArcChartProps<DataRow> = $props();
</script>

<ArcChart {data} {series}></ArcChart>
