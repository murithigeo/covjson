<script lang="ts">
	interface Props {
		data: DataRow<number>[];
	}

	let { data = $bindable() }: Props = $props();
    // Showcase using urls
</script>
