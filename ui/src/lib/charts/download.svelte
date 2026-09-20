<script lang="ts">
	import { downloadImage, type ChartImageOptions } from 'layerchart';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props extends ChartImageOptions {
		container: HTMLElement;
		filename: string;
	}
	let { container = $bindable(), format = 'png', ...props }: Props = $props();
</script>

<ButtonGroup.Root orientation="horizontal">
	<Button variant="outline" onclick={() => downloadImage(container, props)}></Button>
</ButtonGroup.Root>
