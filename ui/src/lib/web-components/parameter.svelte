<script lang="ts">
	import type { Parameter } from 'coveragejson';
	import { Parameter as PrClass, type MinMax, isUndefined } from '@murithigeo/covjson-core';
	import LocaleTable from './locale-table.svelte';
	import ObservedProperty from './observed-property.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Collapsible from '../components/ui/collapsible/index.ts';
	import * as Item from '../components/ui/item/index.ts';
	import { Checkbox } from '../components/ui/checkbox/index.ts';
	import { buttonVariants } from '../components/ui/button/index.ts';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		RulerDimensionLineIcon,
		ChevronsUpDown,
		SunSnowIcon,
		LanguagesIcon
	} from '@lucide/svelte';
	import type { MetadataRenderProps } from './types.d.ts';
	import { getDashCtx } from './dashboards/ctx.svelte.ts';

	interface Props extends MetadataRenderProps<Parameter | PrClass> {
		open?: boolean;
		key: string;
	}

	let { data = $bindable(), open = $bindable(false), key }: Props = $props();

	const ctx = getDashCtx();
	let parameter = $derived(data instanceof PrClass ? data : new PrClass(data, key));
	const label = $derived(parameter.label);
	const statFormatter = (stat?: string | number | null) => {
		if (isUndefined(stat) || stat === null) return 'NULL';
		const symbol = parameter.unit?.symbol?.value;
		if (typeof stat === 'number') stat = stat.toFixed(2);
		if (symbol) {
			if (typeof stat === 'string') ` ${symbol}`;
			stat += symbol;
		}
		return stat;
	};
	let rangeInfo = $derived(ctx.rangeInfo.get(key));
</script>

<Collapsible.Root class="border" bind:open>
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
				<Badge variant="outline"
					><p class={`text-[${ctx.rangeInfo.get(key)?.color || ''}]`}>
						{rangeInfo?.dataType || 'dType Undefined'}
					</p></Badge
				>
			</Item.Title>
			<Item.Description class="grid w-full grid-cols-2 gap-2">
				<Label><Badge variant="outline">min</Badge>{statFormatter(rangeInfo?.min)}</Label>
				<Label><Badge variant="outline">max</Badge>{statFormatter(rangeInfo?.max)}</Label>
				<Label><Badge variant="outline">Average</Badge>{statFormatter(rangeInfo?.avg)}</Label>
				<Label><Badge variant="outline">median</Badge>{statFormatter(rangeInfo?.median)}</Label>
				<div></div>
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
						<Item.Media><LanguagesIcon class="size-5" /></Item.Media>
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

				<Collapsible.Root>
					<Item.Root size="sm" variant="outline">
						<Item.Media><RulerDimensionLineIcon class="size-5" /></Item.Media>
						<Item.Content>
							<Item.Title>Unit</Item.Title>
						</Item.Content>
						<Item.Actions>
							<Collapsible.Trigger
								class={buttonVariants({ variant: 'ghost' })}
								disabled={!parameter.unit}
							>
								<ChevronsUpDown />
							</Collapsible.Trigger>
						</Item.Actions>
					</Item.Root>
					{#if parameter.unit}
						<Collapsible.Content>
							{#if parameter.unit.symbol}
								<Item.Root>
									<Item.Content>
										<Item.Title lang="en"><Label>{parameter.unit.symbol.value}</Label></Item.Title>
										<Item.Description>
											{#if parameter.unit.symbol?.type}
												<a href={parameter.unit.symbol.type} rel="external"
													>{parameter.unit.symbol.type}</a
												>
											{:else}
												No Serialization Scheme
											{/if}
										</Item.Description>
									</Item.Content>
								</Item.Root>
							{/if}
							<LocaleTable data={{ label: parameter.unit.label }} />
						</Collapsible.Content>
					{/if}
				</Collapsible.Root>
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
