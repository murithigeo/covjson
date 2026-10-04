<script lang="ts">
	import { ModeWatcher, setMode, systemPrefersMode } from 'mode-watcher';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button, type ButtonProps } from '#lib/components/ui/button/index.js';

	let { variant = 'outline', size = 'sm', ...props }: ButtonProps = $props();
</script>

<ModeWatcher />

<ButtonGroup.Root>
	<Button {variant} {size} {...props} onclick={() => setMode('light')}>Light</Button>
	<Button {variant} {size} {...props} onclick={() => setMode('dark')}>Dark</Button>
	<Button {variant} {size} {...props} onclick={() => setMode('system')}>System</Button>
</ButtonGroup.Root>
