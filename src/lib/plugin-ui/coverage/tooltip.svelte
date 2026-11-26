<script lang="ts">
	import { Tooltip } from 'layerchart';
	import type { Axis, Data, TooltipProps } from '../types.js';
	import { CustomDate, isNull, isUndefined, type DataRow } from '#lib/core/index.js';
	import type { ComponentProps } from 'svelte';

	type TooltipItemProps = ComponentProps<typeof Tooltip.Item>;
	let {
		colors,
		series,
		active,
		tooltip = $bindable(),
		data,
		context,
		resolver,
		format = (k, v) => v?.toString(),
		rangeIds,
		axesSize,
		labels
	}: TooltipProps = $props();

	let visibleSeries = $derived.by(() => {
		let keys: string[];
		if (context.series.highlightKey) keys = [context.series.highlightKey];
		else keys = context.series.visibleSeries.map(({ key }) => key);
		return keys.map((v) => Number(v));
	});

	let resolvedTipData = $derived.by(() => {
		let _data: DataRow | null = context.tooltip.data;
		if (!_data) return [];
		if (!series) return [_data];

		const indices = axesSize
			.keys()
			.filter((k) => k !== series)
			.map((key) => [key, _data[key] ?? 0] as const)
			.toArray();
		return data
			.filter((d) => visibleSeries.map((d) => Number(d)).includes(d[series]!))
			.filter((d) => indices.every(([k, i]) => d[k] === i));
	});
	const resolveAndFormat = (an: Axis, idx?: number) => {
		const value = resolver(an, idx ?? 0, 'chart');
		if (value instanceof CustomDate) return value.value;
		if (typeof value === 'number' && labels[an]) return `${value}${labels[an].unit}`;
		return value;
	};
	const setTooltip = (r: Data) => {
		tooltip = r;
	};

	$effect(() => setTooltip(resolvedTipData));
	const valueAlign: TooltipItemProps['valueAlign'] = 'right';
	const classes = {
		label: 'text-xs',
		value: 'text-xs font-medium',
		color: 'rounded-none'
	} satisfies TooltipItemProps['classes'];

	let rows = $derived.by(() => {
		return tooltip.map((row) => {
			let header: { label: string; value: unknown } | undefined = undefined;
			if (series) {
				header = {
					value: resolveAndFormat(series, row[series]),
					label: labels[series]?.title || series
				};
			}
			return {
				header,
				rows: rangeIds.map((key) => {
					let value = row[key];
					if (isNull(value)) value = 'No Data';
					else value = format(key, value) || value;
					return {
						key,
						value,
						category: row[`${key}:cat`],
						get color() {
							if (!this.category) return colors[key].default;
							return colors[key][this.category] ?? colors[key].default;
						}
					};
				})
			};
		});
	});
</script>

{#if tooltip.length}
	<Tooltip.Root pointerEvents portal={false} class="rounded-none">
		<Tooltip.Header>
			<Tooltip.List class="w-full">
				{#each axesSize
					.entries()
					.filter(([, s]) => s > 0)
					.filter(([an]) => an !== series)
					.toArray()
					.sort(([, a], [, b]) => a - b) as [an] (an)}
					<Tooltip.Item
						{valueAlign}
						{classes}
						label={labels[an]?.title || an}
						value={resolveAndFormat(an, tooltip[0][an])}
					/>
				{/each}
			</Tooltip.List>
		</Tooltip.Header>
		{#each rows as data, i (i)}
			<Tooltip.List
				>{#if data.header}
					<Tooltip.Item
						{valueAlign}
						{classes}
						label={data.header.label}
						value={data.header.value}
					/>
				{/if}
				{#each data.rows as { key, category, value, color } (key)}
					<Tooltip.Item
						{valueAlign}
						classes={{
							...classes,
							value: classes.value.concat(active === key ? ' font-bold' : '')
						}}
						{color}
						{value}
					>
						{#snippet label()}
							<div class="flex flex-col">
								<p class="{classes.label} capitalize {active === key ? 'font-bold' : ''}">
									{key}
								</p>
								{#if !isUndefined(category)}
									<p class="text-muted-foreground">{category}</p>
								{/if}
							</div>
						{/snippet}
					</Tooltip.Item>
				{/each}
			</Tooltip.List>
			{#if i < tooltip.length - 1}
				<Tooltip.Separator />
			{/if}
		{/each}
	</Tooltip.Root>
{/if}
