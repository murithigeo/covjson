<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { badgeVariants, Badge } from '$lib/components/ui/badge/index.js';
	import { buttonVariants, Button } from '$lib/components/ui/button/index.js';
	import type { ComponentProps } from 'svelte';

	let { hex = $bindable(), ...props }: ComponentProps<typeof ColorPicker> = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger><Badge variant="outline" style="background-color:{hex}"></Badge></Dialog.Trigger>
	<Dialog.Content>
		<ColorPicker {...props} bind:hex isDialog={false} /></Dialog.Content
	>
</Dialog.Root>
