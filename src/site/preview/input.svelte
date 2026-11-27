<script lang="ts">
	import Ajv from 'ajv';
	import v1 from '../json/schemas/1_0.json' with { type: 'json' };
	import covjsonOrgData from './data.js';
	import { TrashIcon } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { SvelteMap } from 'svelte/reactivity';
	import { isUndefined } from '#lib/core/index.js';
	import type { MaplibrePluginOptions } from '#lib/plugin-maplibre/index.js';
	const ajv = new Ajv();
	const validator = ajv.compile(v1);

	interface Props {
		data?: MaplibrePluginOptions['data'];
		type: 'url' | 'file' | 'text';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-useless-assignment
	let { data = $bindable(), type }: Props = $props();

	let urlCache = new SvelteMap<string, string>(Object.entries(covjsonOrgData));
	let files = $state<FileList>();
	let value = $state<string>();
	let name = $state<string>();
	let errors = $state<Partial<Record<'message', string>>[]>([]);

	let invalid = $derived(errors.length > 0);
	async function onclick(validate = true) {
		try {
			let txt: string | undefined;
			if (type === 'url') {
				txt = await fetch(value!).then((res) => {
					if (res.ok) return res.text();
					errors = [{ message: `Error fetching resource:${res.url}. status:${res.status}` }];
					return undefined;
				});
			} else if (type === 'file') {
				txt = await files![0].text();
			} else txt = value!;
			if (!txt) return;
			const json = JSON.parse(txt);
			if (validate && !validator(json)) {
				errors = validator.errors || [{ message: 'Unspecified validation failure' }];
				return;
			}
			data = json;
		} catch (error) {
			if (error instanceof Error) errors = [{}];
		}
	}
</script>

<Field.Group class="space-x-2">
	<Field.Field data-invalid={invalid}>
		{#if type === 'file'}
			<Label for="selector">Select File</Label>
			<Input
				id="selector"
				aria-invalid={invalid}
				type="file"
				accept="application/json, application/prs.coverage+json, .json, .covjson, application/vnd.cov+json"
				bind:files
				required
			/>
		{:else if type === 'url'}
			<Label for="link">Load Remote Document</Label>
			<Input type="url" bind:value aria-invalid={invalid} required />
		{:else}
			<Textarea
				bind:value={
					() => {
						if (value) return JSON.stringify(JSON.parse(value), undefined, 4);
						return '';
					},
					(v) => {
						value = v;
					}
				}
				aria-invalid={invalid}
				required
			/>
		{/if}
	</Field.Field>
	{#if type === 'url'}
		<Field.Field>
			<Label for="url-name">Specify name</Label>
			<Input type="text" bind:value={name} />
		</Field.Field>
	{/if}
	{#each errors as err, i (i)}
		<Field.Error>{err.message}</Field.Error>
	{/each}
	<Field.Field>
		<ButtonGroup.Root>
			<Button
				variant="outline"
				onclick={() => onclick(true)}
				disabled={type === 'file' ? !files?.length : !value}>Load</Button
			>
			<Button
				variant="outline"
				disabled={type !== 'url' || !value || isUndefined(name)}
				onclick={() => {
					if (!value) return;
					urlCache.set(name || urlCache.size.toString(), value);
				}}
			>
				Save</Button
			>
		</ButtonGroup.Root>
	</Field.Field>
	{#if type === 'url'}
		<Field.Field>
			<ButtonGroup.Root class="flex flex-wrap">
				{@const variant = 'outline'}
				{#each urlCache as [k, v] (k)}
					<ButtonGroup.Root>
						<Button
							variant={name === k ? 'secondary' : 'outline'}
							disabled={type !== 'url'}
							onclick={() => {
								[name, value] = [k, v];
								onclick(false);
							}}
							class="hover:cursor-pointer"
							size="sm"
						>
							{k}
						</Button>
						<Button
							{variant}
							size="icon-sm"
							onclick={() => {
								urlCache.delete(k);
							}}><TrashIcon /></Button
						>
					</ButtonGroup.Root>
				{/each}
			</ButtonGroup.Root>
		</Field.Field>
	{/if}
</Field.Group>
