<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { SquareIcon } from '@lucide/svelte';
	import type { ComponentProps } from 'svelte';

	let { hex = $bindable(), ...props }: ComponentProps<typeof ColorPicker> = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger class={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
		><SquareIcon style="background-color:{hex}" /></Dialog.Trigger
	>
	<Dialog.Content>
		<ColorPicker {...props} bind:hex isDialog={false} /></Dialog.Content
	>
</Dialog.Root>
