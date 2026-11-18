<script lang="ts">
	let { color }: { color?: string } = $props();
</script>

{#if color}
	<div class="size-4 rounded-none" style:background-color={color} style:border-color={color}></div>
{/if}
