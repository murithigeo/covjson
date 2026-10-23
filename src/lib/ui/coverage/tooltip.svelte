<script lang="ts">
	import { getCovContext } from './ctx.svelte.ts';
	import { Tooltip, type ChartState } from 'layerchart';
	import type { Axis, Colors } from './types';
	import { CustomDate, isUndefined, type DataRow } from '#lib/core/index.ts';
	import type { ComponentProps } from 'svelte';
	interface Props {
		colors: Colors;
		series?: Axis;
		current: string;
		context: ChartState;
	}
	let { colors, series, current, context }: Props = $props();
	let data = $derived<DataRow | null>(context.tooltip.data);
	let ctx = getCovContext();
	let tooltip = $derived.by(() => {
		if (!data) return [];
		if (!series) {
			return [data];
		}
		const indices = ctx.axesSize
			.keys()
			.filter((k) => k !== series)
			.map((key) => [key, data[key] ?? 0] as const)
			.toArray();
		return ctx.data
			.filter((d) => {
				if (!series) return true;
				return context.series.visibleSeries.map((d) => Number(d.key)).includes(d[series]!);
			})
			.filter((d) => indices.every(([k, i]) => d[k] === i));
	});
	const setTooltip = (r: DataRow[]) => ctx.setProp('tooltip', r);

	$effect(() => setTooltip(tooltip));

	let prefixes = {
		z: 'm'
		// y: ['S', 'N'],// We coult hook up to Coverage.domain.referencing
		// x: ['W', 'E']
	};

	const resolveAndFormat = (an: Axis, idx?: number) => {
		let value = ctx.resolve(an, idx ?? 0, 'chart');
		if (value instanceof CustomDate) return value.value;
		if (typeof value === 'number') {
			if (an === 'z') return value + prefixes[an];
			// if (an === 'x' || an === 'y') return `${value}°${prefixes[an][Number(value > 0)]}`;
			return value;
		}
		return value;
	};
	const itemProps: Pick<ComponentProps<typeof Tooltip.Item>, 'classes' | 'valueAlign'> = {
		valueAlign: 'right',
		classes: { label: 'text-xs', value: 'text-xs' }
	};

	let rows = $derived.by(() => {
		return tooltip.map((row) => {
			let header: { label: string; value: unknown } | undefined = undefined;
			if (series) {
				const value = resolveAndFormat(series, row[series]);
				if (value) header = { value, label: series };
			}
			return {
				header,
				rows: ctx.rangeIds.map((key) => ({
					key,
					value: row[key],
					category: row[`${key}:cat`],
					get color() {
						if (!this.category) return colors[key].default;
						return colors[key][this.category] ?? colors[key].default;
					}
				}))
			};
		});
	});
</script>

{#if tooltip.length}
	<Tooltip.Root pointerEvents portal={false}>
		<Tooltip.Header>
			<Tooltip.List class="w-full">
				{#each ctx.axesSize
					.entries()
					.filter(([, s]) => s > 0)
					.filter(([an]) => an !== series) as [an] (an)}
					<Tooltip.Item {...itemProps} label={an} value={resolveAndFormat(an, tooltip[0][an])} />
				{/each}
			</Tooltip.List>
		</Tooltip.Header>
		{#each rows as data, i (i)}
			<Tooltip.List
				>{#if data.header}
					<Tooltip.Item {...itemProps} label={data.header.label} value={data.header.value} />
				{/if}
				{#each data.rows as { key, category, value, color } (key)}
					<Tooltip.Item {...itemProps} {color} {value}>
						{#snippet label()}
							<div class="flex flex-col">
								<p class:font-bold={current === key}>{key}</p>
								{#if !isUndefined(category)}
									<p>{category}</p>
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
