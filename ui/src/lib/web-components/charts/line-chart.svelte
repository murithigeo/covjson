<script lang="ts">
	import { LineChart, type LineChartProps } from 'layerchart';
	import type { DataRow } from '@murithigeo/covjson-core';

	let { data = $bindable(), series = $bindable(), ...props }: LineChartProps<DataRow> = $props();
</script>

<LineChart {...props} {data} {series}></LineChart>
