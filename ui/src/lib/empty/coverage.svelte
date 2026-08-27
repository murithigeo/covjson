<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { LayoutListIcon } from '@lucide/svelte';
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="outline"><LayoutListIcon /></Empty.Media>
		<Empty.Title>No Data</Empty.Title>
		<Empty.Description>Click on Map to See Coverages</Empty.Description>
	</Empty.Header>
</Empty.Root>
