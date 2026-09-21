<script lang="ts">
	import { MultiDate } from '$lib/dashboards/utils/date.js';
	import * as Select from '$lib/components/ui/select/index.js';
	interface Props {
		dates: MultiDate[];
	}

	let { dates = $bindable() }: Props = $props();
</script>

<Select.Root
	type="multiple"
	items={dates.map((v) => ({
		label: v.toJSON(),
		value: v.toJSON()
	}))}
	class="w-full"
>
	<Select.Trigger class="w-full">
		<Select.Value placeholder="Select Dates" />
	</Select.Trigger>
	<Select.Content class="max-h-[300px]">
		{#each dates as date, i (i)}
			<Select.Group>
				<Select.Label>{date.toString()}</Select.Label>
				{#each date.items as value (value)}
					<Select.Item {value} label={value}>{value}</Select.Item>
				{/each}
			</Select.Group>
		{/each}
	</Select.Content>
</Select.Root>
