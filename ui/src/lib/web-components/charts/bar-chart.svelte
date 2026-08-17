<script lang="ts">
	import type { BarChartProps } from './types.d.ts';
	import {} from '@murithigeo/covjson-core';
	import { Bar } from 'layerchart';

	let { data = $bindable(), series = $bindable(), ...props }: BarChartProps = $props();
</script>

<Bar {...props} {data} {series}></Bar>
