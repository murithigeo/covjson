<script lang="ts" module>
	import * as Table from '$lib/components/ui/table/index.js';
	import { Coverage, type DataRow } from '@murithigeo/covjson-core';
</script>

<script lang="ts">
	interface Props {
		coverage: Coverage;
		data: DataRow[];
	}

	let { data = $bindable() }: Props = $props();
</script>

<Table.Root></Table.Root>
