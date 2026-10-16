<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import ColorPicker from 'svelte-awesome-color-picker';
	import type { ComponentProps } from 'svelte';

	let { hex = $bindable(), ...props }: ComponentProps<typeof ColorPicker> = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger
		><div
			style="background-color:{hex};"
			class="size-4 shrink-0 rounded-xs border-black dark:border-white"
		></div></Dialog.Trigger
	>
	<Dialog.Content>
		<ColorPicker bind:hex isDialog={false} label="" {...props} /></Dialog.Content
	>
</Dialog.Root>
