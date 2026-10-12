<script lang="ts">
	import '#lib/ui/metadata/parameter-cpt.svelte';
	import { Popup, Control } from 'svelte-maplibre';
	import Maplibre from '#lib/ui/preview/maplibre.svelte';

	// todo control button, render parameters left and coverages left(needs custom svelte components)
</script>

<Maplibre>
	{#snippet children({ map })}{/snippet}
</Maplibre>
