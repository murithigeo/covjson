<script lang="ts">
	import { ModeWatcher, setMode, mode, userPrefersMode } from 'mode-watcher';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button, type ButtonProps } from '#lib/components/ui/button/index.js';

	let { size = 'sm', ...props }: ButtonProps = $props();
</script>

<ModeWatcher />

<ButtonGroup.Root>
	<Button
		variant={mode.current == 'light' ? 'outline' : 'secondary'}
		{size}
		{...props}
		onclick={() => setMode('light')}>Light</Button
	>
	<Button
		variant={mode.current == 'dark' ? 'outline' : 'secondary'}
		{size}
		{...props}
		onclick={() => setMode('dark')}>Dark</Button
	>
	<Button
		variant={userPrefersMode.current == 'system' ? 'outline' : 'secondary'}
		{size}
		{...props}
		onclick={() => setMode('system')}>System</Button
	>
</ButtonGroup.Root>
