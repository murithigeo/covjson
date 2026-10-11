<script lang="ts">
	import type { Coverage } from '#lib/core/index.ts';
	import TresDashboard from '#lib/ui/dashboards/tres-dashboard-cpt.svelte';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import DataInput from '#lib/ui/preview/input.svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { JsonView } from '@zerodevx/svelte-json-view';
	import ModeWatcher from '#lib/mode-watcher.svelte';
	import Maplibre from '#lib/ui/preview/maplibre.svelte';
	import CovJsonSource from '#lib/docs/maplibre/source.svelte';
	// Add support https://www.npmjs.com/package/netcdfjs
	let data = $state<object>();
	let coverages = $state<Coverage[]>([]);
</script>

<div class="h-screen">
	<div class="flex flex-row">
		<Sheet.Root>
			<Sheet.Trigger class={buttonVariants({ variant: 'outline' })}>Load Data</Sheet.Trigger>
			<Sheet.Content class="gap-2 "
				><Sheet.Header
					><Sheet.Title>Load CoverageJSON</Sheet.Title>
					<Sheet.Description>
						<ModeWatcher />
					</Sheet.Description></Sheet.Header
				>
				<div class="h-screen gap-2 overflow-auto">
					<Tabs.Root value="url" class="px-4">
						<Tabs.List>
							<Tabs.Trigger value="file">File</Tabs.Trigger>
							<Tabs.Trigger value="json">JSON</Tabs.Trigger>
							<Tabs.Trigger value="url">URL</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="file">
							<DataInput bind:data type="file" />
						</Tabs.Content>
						<Tabs.Content value="json">
							<DataInput bind:data type="text" />
						</Tabs.Content>
						<Tabs.Content value="url">
							<DataInput bind:data type="url" />
						</Tabs.Content>
					</Tabs.Root>
					<div class="px-4">
						<JsonView json={data} />
					</div>
				</div>
			</Sheet.Content>
		</Sheet.Root>
		<Label>! In Alpha</Label>
	</div>
	<TresDashboard bind:data={coverages}>
		<Maplibre>
			<CovJsonSource bind:data></CovJsonSource>
		</Maplibre>
	</TresDashboard>
</div>
