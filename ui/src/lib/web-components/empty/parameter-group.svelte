<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { VariableIcon } from '@lucide/svelte';
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="icon"><VariableIcon /></Empty.Media>
		<Empty.Title>No Parameter Groups Available.</Empty.Title>
		<Empty.Description>Click on the Map to See available Parameter Groups</Empty.Description>
	</Empty.Header>
</Empty.Root>
