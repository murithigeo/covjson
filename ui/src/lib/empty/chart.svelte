<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { DatabaseXIcon, LoaderIcon, TriangleAlertIcon } from '@lucide/svelte';

	interface Props {
		status: 'loading' | 'loaded' | 'error';
	}
	let { status = $bindable('loading') }: Props = $props();
	let props = $derived.by(() => {
		let props = {
			title: 'Resolving Remote Data',
			description: 'Resolving NdArray/TiledNdArray values',
			icon: LoaderIcon
		};
		if (status === 'loaded') {
			props.title = 'No Data Loaded';
			props.description = 'Coverage May Have No Ranges or Indices Resolve to Nothing';
			props.icon = DatabasXIcon;
		}
		if (status === 'error') {
			props.title = 'Error Loading/Visualizing Data';
			props.description = 'HTTP Error or Inadequate Chart Config';
			props.icon = TriangleAlertIcon;
		}
		return props;
	});
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="outline">
			{#if loading}
				<Spinner><props.icon /></Spinner>
			{:else}
				<props.icon />
			{/if}
		</Empty.Media>
		<Empty.Title>{props.title}</Empty.Title>
		<Empty.Description>{props.description}</Empty.Description>
	</Empty.Header>
</Empty.Root>
