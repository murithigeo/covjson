<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.ts';
	import { SvelteSet } from 'svelte/reactivity';
	import type { DataViewProps } from './types';

	type Row = Record<string, unknown>;

	let {
		data,
		axesConfig,
		axisNames,
		tooltip,
		fx
	}: {
		data: Row[];
		axesConfig: DataViewProps['axesConfig'];
		axisNames: Record<string, string>;
		tooltip?: Row | null;
		fx?: string;
	} = $props();

	const keys = $derived([...axesConfig]);

	const rows = $derived.by(() => {
		if (!tooltip) return [];

		// No faceting: a single row with the hovered indices.
		if (!fx || !keys.includes(fx)) {
			return [Object.fromEntries(keys.map((k) => [k, tooltip[k]]))];
		}

		// Faceting by fx: one row per fx index that exists alongside the
		// other hovered indices, so every facet cell is represented.
		const others = keys.filter((k) => k !== fx);
		const fxValues = new SvelteSet<unknown>();
		for (const d of data) {
			if (others.every((k) => d[k] === tooltip[k])) fxValues.add(d[fx]);
		}

		return [...fxValues]
			.sort((a, b) => Number(a) - Number(b))
			.map((v) => Object.fromEntries(keys.map((k) => [k, k === fx ? v : tooltip[k]])));
	});
</script>

{#if rows.length}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				{#each keys as k (k)}
					<Table.Head>{axisNames[k] ?? k}</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each rows as row, i (i)}
				<Table.Row>
					{#each keys as k (k)}
						<Table.Cell class="font-mono tabular-nums">
							{row[k] ?? '—'}
						</Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/if}
