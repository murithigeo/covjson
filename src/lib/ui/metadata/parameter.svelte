<script lang="ts">
	import { isNull, isUndefined, Parameter, type RangeStatistics } from '#lib/core/index.ts';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import * as Item from '#lib/components/ui/item/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Badge, type BadgeVariant } from '#lib/components/ui/badge/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import UnitComponent from './parameter/unit.svelte';
	import { ChevronsUpDown, SunSnowIcon, LanguagesIcon } from '@lucide/svelte';
	import type { MetadataRenderProps, OnChangeFn, OnColorChange } from './types';
	import ColorPicker from './parameter/color-picker.svelte';
	import CategoryTable from './category-table.svelte';

	interface Props extends MetadataRenderProps<Parameter> {
		stats?: RangeStatistics;
		open?: boolean;
		color?: string;
		onColorChange?: OnColorChange;
		key?: string;
		checked?: boolean;
		checkable?: boolean;
		onCheckedChange?: OnChangeFn<Parameter, boolean>;
	}

	let {
		data: parameter = $bindable(),
		open = $bindable(false),
		stats = $bindable(),
		color = $bindable(),
		checkable = $bindable(true),
		key: pKey,
		checked = $bindable(true),
		onColorChange,
		onCheckedChange
	}: Props = $props();

	let key = $derived(pKey || parameter.key);
	const label = $derived(parameter.label);

	const processStats = (v: number | string | null | undefined) => {
		if (isUndefined(v) || isNull(v)) return 'NULL';
		if (typeof v === 'string') return v;
		if (stats?.dataType === 'integer') return Math.round(v);
		return v?.toFixed(2);
	};

	const variant: BadgeVariant = 'outline';
</script>

<Collapsible.Root bind:open>
	<Item.Root class="w-full" id="parameter:{key}">
		<Item.Media>
			{#if checkable}
				<Checkbox
					bind:checked
					onCheckedChange={(checked) => onCheckedChange?.(parameter, checked)}
				/>{/if}</Item.Media
		>

		<Item.Content>
			<Item.Title lang={label.query()?.tag}
				><Label>{label.query()?.value || parameter.key || parameter.id}</Label>
				<Badge {variant}>
					{stats?.dataType || 'Unknown'}
				</Badge>
				{#if parameter.unit?.symbol?.value}
					<Badge {variant}>{parameter.unit.symbol.value}</Badge>
				{/if}
				<ColorPicker hex={color} onInput={({ hex }) => onColorChange?.(parameter, hex)} label="" />
			</Item.Title>
			{#if stats}
				<Item.Description class="grid grid-cols-2 gap-1">
					{#each Object.entries(stats).filter(([k]) => !['dataType', 'frequency'].includes(k)) as [name, val]}
						<Label><Badge {variant}>{name}</Badge>{processStats(val)}</Label>
					{/each}
				</Item.Description>
			{/if}
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
				{#if parameter.observedProperty.categories}
					<CategoryTable
						data={parameter.observedProperty.categories}
						onColorChange={(catId, color) => onColorChange?.(parameter, color, catId)}
						stats={stats?.frequency}
					/>
				{/if}
			</Card.Content>
		</Card.Root>
	</Collapsible.Content>
</Collapsible.Root>
