<script lang="ts">
	import { Parameter, isUndefined } from '@murithigeo/covjson-core';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { buttonVariants, Button } from '$lib/components/ui/button/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Badge, type BadgeProps } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { ChartNoAxesColumnIcon } from '@lucide/svelte';
	import type { RangeStatistics } from '$lib/statistics.js';
	import UnitComponent from './parameter/unit.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import {
		RulerDimensionLineIcon,
		ChevronsUpDown,
		SunSnowIcon,
		LanguagesIcon
	} from '@lucide/svelte';
	import type { MetadataRenderProps } from './types.d.ts';
	import { getDashCtx } from '../dashboards/utils/ctx.svelte.ts';

	type Props = MetadataRenderProps<
		Parameter,
		{
			open?: boolean;
			key: string;
		}
	>;

	const badgeProps: BadgeProps = { variant: 'outline' };
	let { data: parameter = $bindable(), open = $bindable(false), key }: Props = $props();

	const ctx = getDashCtx();
	const label = $derived(parameter.label);

	let rangeInfo = $derived.by(() => {
		const overall = ctx.rangeInfo.get(key) || {};
		const coverage = { ...overall, ...(ctx.highlightCovSummary.get(key) || {}) };
		function processStats(arr: (string | number | null | undefined)[]) {
			let symbol = parameter.unit?.symbol.value;
			if (symbol && arr.some((v) => typeof v === 'string'))
				symbol = symbol.padStart(symbol.length + 1, ' ');
			return arr
				.map((v) => {
					if (isUndefined(v) || v === null) return 'NULL';
					if (typeof v === 'string') return v;
					if (overall.dataType && overall.dataType) {
						if (overall.dataType === 'integer') return Math.round(v);
						else return v.toFixed(2);
					} else return v;
				})
				.join('/');
			// .concat(symbol || '');
		}

		coverage.min = processStats([coverage?.min, overall?.min]);
		coverage.max = processStats([coverage?.max, overall?.max]);
		coverage.mean = processStats([coverage?.mean, overall?.mean]);
		coverage.median = processStats([coverage?.median, overall?.median]);
		return coverage;
	});

	let histogramData = $derived.by(() => {});
</script>

<Collapsible.Root bind:open>
	<Item.Root class="w-full" id="parameter:{key}">
		<Item.Media>
			<Checkbox
				checked={ctx.selected.has(key)}
				onCheckedChange={() => ctx.updateParameterSelectionStatus(key)}
			/></Item.Media
		>
		<Item.Content>
			<Item.Title lang={label.query()?.tag}
				><Label>{label.query()?.value || parameter.key || parameter.id}</Label>
				<Badge {...badgeProps}
					><p class={`text-[${ctx.rangeInfo.get(key)?.color || ''}]`}>
						{rangeInfo?.dataType || 'Unknown'}
					</p></Badge
				>
				{#if parameter.unit?.symbol?.value}
					<Badge {...badgeProps}>{parameter.unit.symbol.value}</Badge>
				{/if}
			</Item.Title>
			<Item.Description class="grid grid-cols-2 gap-1">
				<Label><Badge {...badgeProps}>min</Badge>{rangeInfo?.min}</Label>
				<Label><Badge {...badgeProps}>mean</Badge>{rangeInfo?.mean}</Label>
				<Label><Badge {...badgeProps}>max</Badge>{rangeInfo?.max}</Label>
				<Label class="text-ellipsis"
					><Badge {...badgeProps}>median</Badge>{rangeInfo?.median}
				</Label>
			</Item.Description>
		</Item.Content><Item.Actions>
			<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}>
				<ChevronsUpDown />
			</Collapsible.Trigger>
		</Item.Actions>
	</Item.Root>
	<Collapsible.Content>
		<Card.Root>
			<Card.Content>
				<Collapsible.Root open>
					<Item.Root size="sm" variant="outline"
						><Item.Media variant="icon" size="icon-sm"><ChartNoAxesColumnIcon /></Item.Media>
						<Item.Content><Item.Title>Histogram</Item.Title></Item.Content>
						<Item.Actions>
							<Collapsible.Trigger
								class={buttonVariants({ variant: 'ghost' })}
								disabled={!parameter.unit}
							>
								<ChevronsUpDown />
							</Collapsible.Trigger>
						</Item.Actions></Item.Root
					>
				</Collapsible.Root>
				<Collapsible.Root disabled={!parameter.label.size && !parameter.description.size}>
					<Item.Root size="sm" variant="outline">
						<Item.Media variant="icon"><LanguagesIcon class="size-5" /></Item.Media>
						<Item.Content>
							<Item.Title lang="en">Internationalization</Item.Title>
						</Item.Content>
						<Item.Actions>
							<Collapsible.Trigger
								class={buttonVariants({ variant: 'ghost' })}
								disabled={!parameter.label.size && !parameter.description.size}
							>
								<ChevronsUpDown />
							</Collapsible.Trigger>
						</Item.Actions>
					</Item.Root>
					<Collapsible.Content class="border-l">
						<LocaleTable
							data={{
								label: parameter.label,
								description: parameter.description
							}}
						/>
					</Collapsible.Content>
				</Collapsible.Root>
				<UnitComponent data={parameter.unit} />
				<Collapsible.Root>
					<Item.Root size="sm" variant="outline">
						<Item.Media>
							<SunSnowIcon />
						</Item.Media>
						<Item.Content>
							<Item.Title lang="en">Observed Property</Item.Title>
						</Item.Content>
						<Item.Actions>
							<Collapsible.Trigger class={buttonVariants({ variant: 'ghost' })}>
								<ChevronsUpDown />
							</Collapsible.Trigger>
						</Item.Actions>
					</Item.Root>
					<Collapsible.Content>
						{#if parameter.observedProperty}
							<ObservedProperty data={parameter.observedProperty} />
						{/if}
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Content>
		</Card.Root>
	</Collapsible.Content>
</Collapsible.Root>
