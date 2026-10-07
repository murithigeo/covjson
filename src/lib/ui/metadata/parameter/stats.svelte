<script lang="ts">
	import { Label } from '#lib/components/ui/label/index.js';
	import { Badge, type BadgeVariant } from '#lib/components/ui/badge/index.js';
	import { isUndefined, isNull } from '#lib/core/index.ts';
	import type { RangeStatistics } from '#lib/core/ranges.ts';
	import { cn } from '#lib/utils.ts';
	import type { ClassValue } from 'clsx';

	let {
		min = $bindable(),
		max = $bindable(),
		median = $bindable(),
		mean = $bindable(),
		dataType,
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
