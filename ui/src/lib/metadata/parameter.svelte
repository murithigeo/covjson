<script lang="ts">
	import { isUndefined } from '@murithigeo/covjson-core';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import UnitComponent from './parameter/unit.svelte';
	import { ReactiveParameter } from '$lib/dashboards/utils/parameter.svelte.js';
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
		ReactiveParameter,
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

	function processStats(...stats: (number | string | null | undefined)[]) {
		return stats
			.map((v) => {
				if (isUndefined(v) || v === null) return 'NULL';
				if (typeof v === 'string') return v;
				if (parameter.dataType === 'integer') return Math.round(v);
				return v.toFixed(2);
			})
			.join('/');
	}
	let covStats = $derived(ctx.currentCoverageSummary?.get(key));

	let min = $derived(processStats(covStats?.min, parameter.min));
	let max = $derived(processStats(covStats?.max, parameter.max));
	let median = $derived(processStats(covStats?.median, parameter.median));
	let mean = $derived(processStats(covStats?.mean, parameter.mean));
</script>

<Collapsible.Root bind:open>
	<Item.Root class="w-full" id="parameter:{key}">
		<Item.Media>
			<Checkbox
				checked={ctx?.selected.has(key)}
				onCheckedChange={ctx.updateParameterSelectionStatus(key)}
			/></Item.Media
		>
		<Item.Content>
			<Item.Title lang={label.query()?.tag}
				><Label>{label.query()?.value || parameter.key || parameter.id}</Label>
				<Badge {variant}
					><p class={`text-[${ctx.parameters.get(key)?.color || ''}]`}>
						{parameter.dataType || 'Unknown'}
					</p></Badge
				>
				<Badge {variant}>{parameter.ranges.size || 0} Covs</Badge>
				{#if parameter.unit?.symbol?.value}
					<Badge {variant}>{parameter.unit.symbol.value}</Badge>
				{/if}
				<ColorPicker
					hex={parameter?.color}
					onInput={({ hex }) => ctx.setParameterColor(key, hex)}
					label=""
				/>
			</Item.Title>
			<Item.Description class="grid grid-cols-2 gap-1">
				<Label><Badge {variant}>min</Badge>{min}</Label>
				<Label><Badge {variant}>mean</Badge>{mean}</Label>
				<Label><Badge {variant}>max</Badge>{max}</Label>
				<Label class="text-ellipsis"><Badge {variant}>median</Badge>{median}</Label>
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
						<Item.Media variant="icon">
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
				<CategoryTable data={parameter.categories} parameterKey={key} />
			</Card.Content>
		</Card.Root>
	</Collapsible.Content>
</Collapsible.Root>
