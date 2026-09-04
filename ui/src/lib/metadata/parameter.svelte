<script lang="ts">
	import { Parameter, isUndefined } from '@murithigeo/covjson-core';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { RangeStatistics, RangeConfig } from '$lib/statistics.js';
	import UnitComponent from './parameter/unit.svelte';
	import Histogram from './parameter/histogram.svelte';

	import {
		ChevronsUpDown,
		SunSnowIcon,
		LanguagesIcon,
		ChartNoAxesColumnIcon
	} from '@lucide/svelte';
	import type { MetadataRenderProps } from './types.d.ts';
	import { getDashCtx } from '../dashboards/utils/ctx.svelte.ts';
	import ColorPicker from './parameter/color-picker.svelte';
	import CategoryTable from './category-table.svelte';
	type Props = MetadataRenderProps<
		Parameter,
		{
			open?: boolean;
			key: string;
			badgeVariant?: BadgeVariant;
		}
	>;

	let {
		data: parameter = $bindable(),
		open = $bindable(false),
		key,
		badgeVariant: variant = 'outline'
	}: Props = $props();

	const ctx = getDashCtx();
	const label = $derived(parameter.label);

	let rangeInfo = $derived.by(() => {
		const overall = ctx.rangeInfo.get(key);
		const coverage = ctx.currentCoverageSummary?.get(key);
		function processStats(arr: (string | number | null | undefined)[]) {
			return arr
				.map((v) => {
					if (isUndefined(v) || v === null) return 'NULL';
					if (typeof v === 'string') return v;
					if (overall?.dataType && overall?.dataType === 'integer') return Math.round(v);
					return v.toFixed(2);
				})
				.join('/');
		}
		const stats: Partial<Record<keyof RangeStatistics | 'dataType', string>> & {
			color?: RangeConfig['color'];
		} = { color: overall?.color };
		stats.min = processStats([coverage?.min, overall?.min]);
		stats.max = processStats([coverage?.max, overall?.max]);
		stats.mean = processStats([coverage?.mean, overall?.mean]);
		stats.median = processStats([coverage?.median, overall?.median]);
		stats.dataType = overall?.dataType || 'Uknown';
		return stats;
	});
</script>

<Collapsible.Root bind:open>
	<Item.Root class="w-full" id="parameter:{key}">
		<Item.Media>
			<Checkbox
				checked={ctx.selected.has(key)}
				onCheckedChange={ctx.updateParameterSelectionStatus(key)}
			/></Item.Media
		>
		<Item.Content>
			<Item.Title lang={label.query()?.tag}
				><Label>{label.query()?.value || parameter.key || parameter.id}</Label>
				<Badge {variant}
					><p class={`text-[${ctx.rangeInfo.get(key)?.color || ''}]`}>
						{rangeInfo?.dataType || 'Unknown'}
					</p></Badge
				>
				{#if parameter.unit?.symbol?.value}
					<Badge {variant}>{parameter.unit.symbol.value}</Badge>
				{/if}
				<ColorPicker
					hex={rangeInfo?.color?.primary}
					onInput={({ hex }) => ctx.setParameterColor(key, hex)}
					label=""
				/>
			</Item.Title>
			<Item.Description class="grid grid-cols-2 gap-1">
				<Label><Badge {variant}>min</Badge>{rangeInfo?.min}</Label>
				<Label><Badge {variant}>mean</Badge>{rangeInfo?.mean}</Label>
				<Label><Badge {variant}>max</Badge>{rangeInfo?.max}</Label>
				<Label class="text-ellipsis"><Badge {variant}>median</Badge>{rangeInfo?.median}</Label>
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
						><Item.Media variant="icon"><ChartNoAxesColumnIcon /></Item.Media>
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
					<Collapsible.Content>
						<Histogram parameterKey={key} />
					</Collapsible.Content>
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
				<CategoryTable data={parameter.observedProperty.categories} parameterKey={key} />
			</Card.Content>
		</Card.Root>
	</Collapsible.Content>
</Collapsible.Root>
