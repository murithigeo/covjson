<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';

	interface Props {
		data: object;
	}

	let { data = $bindable() }: Props = $props();
	let invalid = $state(false);
</script>

<Field.Field data-invalid={invalid} orientation="vertical">
	<Input
		type="file"
		accept="application/json, application/prs.coverage+json, .json, .covjson, application/vnd.cov+json"
		multiple
		// If we allow multiple, then some common elements will be overwritten
		onchange={(e) => {}}
	/>
</Field.Field>
