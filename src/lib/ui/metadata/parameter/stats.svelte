<script lang="ts">
	import { Label } from '#lib/components/ui/label/index.js';
	import { Badge, type BadgeVariant } from '#lib/components/ui/badge/index.js';
	import { isUndefined, isNull, type RangeStatistics } from '#lib/core/index.js';
	import type { ClassValue } from 'clsx';
	import { cn } from '#lib/utils.js';

	let {
		min,
		max,
		median,
		mean,
		'data-type': dataType,
		class: className
	}: RangeStatistics & { class?: ClassValue } = $props();

	const processStats = (v: number | string | null | undefined) => {
		if (isUndefined(v) || isNull(v)) return 'NULL';
		if (typeof v === 'string') return v;
		if (dataType === 'integer') return Math.round(v);
		return v?.toFixed(2);
	};
	const variant: BadgeVariant = 'outline';
</script>

<div class={cn(className)}>
	<Label><Badge {variant}>min</Badge>{processStats(min)}</Label>
	<Label><Badge {variant}>mean</Badge>{processStats(mean)}</Label>
	<Label><Badge {variant}>max</Badge>{processStats(max)}</Label>
	<Label><Badge {variant}>median</Badge>{processStats(median)}</Label>
</div>
