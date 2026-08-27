<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { DatabaseXIcon, LoaderIcon } from '@lucide/svelte';

	interface Props {
		loaded: boolean;
	}
	let { loaded = $bindable(false) }: Props = $props();
	let props = $derived.by(() => {
		let props = {
			title: 'Resolving Remote Data',
			description: 'Resolving NdArray/TiledNdArray values',
			icon: LoaderIcon
		};
		if (loaded) {
			props.title = 'No Data Loaded';
			props.description = 'Coverage May Have No Ranges or Indices Resolve to Nothing';
			props.icon = DatabasXIcon;
		}
		return props;
	});
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="outline">
			<Spinner><props.icon /></Spinner>
		</Empty.Media>
		<Empty.Title>{props.title}</Empty.Title>
		<Empty.Description>{props.description}</Empty.Description>
	</Empty.Header>
</Empty.Root>
