<script lang="ts">
	import type { LineChartProps } from '../types.d.ts';
	import * as Chart from '../../components/ui/chart/index.ts';
	import {LineChart} from "layerchart"
	let { config,data,... }: LineChartProps = $props();
</script>

<Chart.Container {config}></Chart.Container>
