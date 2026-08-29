<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { DatabaseXIcon, LoaderIcon, TriangleAlertIcon } from '@lucide/svelte';
	import { Exception } from '@murithigeo/covjson-core';
	interface Props {
		status: 'loading' | 'loaded' | 'error';
		error?: unknown;
	}
	let { status = $bindable('loading'), error }: Props = $props();

	let data = $derived.by(() => {
		let props = {
			title: 'Resolving Remote Data',
			description: 'Resolving NdArray/TiledNdArray values',
			icon: LoaderIcon
		};

		if (status === 'loaded') {
			props.title = 'No Data Loaded';
			props.description = 'Coverage May Have No Ranges or Indices Resolve to Nothing';
			props.icon = DatabaseXIcon;
		}
		if (status === 'error') {
			props.title = 'Error Visualizing Data';
			props.description = 'Chart Config Error';

			if (error instanceof Exception) {
				props.title = `HTTP Error:${error.status}`;
				props.description = error.url;
			}
			props.icon = TriangleAlertIcon;
		}
		return props;
	});
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="icon">
			{#if status === 'loading'}
				<Spinner><data.icon /></Spinner>
			{:else}
				<data.icon />
			{/if}
		</Empty.Media>
		<Empty.Title>{data.title}</Empty.Title>
		<Empty.Description>{data.description}</Empty.Description>
	</Empty.Header>
</Empty.Root>
