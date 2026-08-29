<script lang="ts">
	import { BarChart } from 'layerchart';
	import type { FrequencyMap, RangeConfig } from '$lib/statistics.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { isUndefined } from '@murithigeo/covjson-core';
	type Props = { config: RangeConfig } & Partial<Record<'overall' | 'coverage', FrequencyMap>>;

	let { overall = $bindable(), coverage = $bindable(), config = $bindable() }: Props = $props();

	let data = $derived.by(() => {
		let data: (Record<"overall", number> & {key:string})[] = [];

		overall?.forEach((size, key) => {
			if (key === null) key = 'NULL';
			data.push({ key, overall: size });
		});
		return data;
	});
</script>

<Chart.Container {config}>
	<BarChart {data} series={} />
</Chart.Container>
