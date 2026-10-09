<script lang="ts">
	import { downloadImage, type ChartImageOptions } from 'layerchart';
	import * as ButtonGroup from '#lib/components/ui/button-group/index.ts';
	import * as Field from '#lib/components/ui/field/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import ColorPicker from '../metadata/parameter/color-picker.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import type { Axis, DownloaderProps } from './types';

	let {
		ref = $bindable(),
		data = $bindable(),
		axisNames = $bindable(),
		categoric = $bindable(),
		axisResolver,
		filename
	}: DownloaderProps = $props();
	let background = $state('white');

	let downloadImageFn = $derived((format: ChartImageOptions['format']) => {
		if (!ref) return;
		downloadImage(ref, { format, background, filename });
	});

	const downloadCsvFn = () => {
		const header = [...axisNames, 'value'];
		if (categoric) header.push('category');
		/**
		 * https://stackoverflow.com/a/31536517
		 */
		const str = [
			header.join(','),
			...data.map((row) =>
				header.map((fieldName) => {
					let value: unknown = row[fieldName];
					if (axisNames.includes(fieldName as Axis))
						value = axisResolver?.(fieldName as Axis, value as number) || value;
					// For MultiPoint, we can split into x,y,z
					if (Array.isArray(value)) return JSON.stringify(value, null, 2);
					return value;
				})
			)
		].join('\r\n');
		const blob = new Blob([str], { type: 'text/csv;charset=utf-8' });
		const container = document.createElement('a');
		container.href = URL.createObjectURL(blob);
		container.download = filename + '.csv';
		container.click();
		container.remove();

		setTimeout(() => URL.revokeObjectURL(container.href), 0);
	};
</script>

<div class="grid w-full items-center">
	<div class="flex flex-col items-center space-y-2">
		<Label>Image</Label>
		<ButtonGroup.Root>
			<Button variant="outline" onclick={() => downloadImageFn('png')}>PNG</Button>
			<Button variant="outline" onclick={() => downloadImageFn('jpeg')}>JPEG</Button>
			<Button variant="outline" onclick={() => downloadImageFn('webp')}>WebP</Button>
		</ButtonGroup.Root>
		<Field.Group>
			<Field.Field>
				<Label for="background">Background</Label>
				<ColorPicker bind:hex={background} />
			</Field.Field>
		</Field.Group>
	</div>

	<div class="flex flex-col items-center space-y-2">
		<Label>Binaries</Label>
		<Button onclick={downloadCsvFn} variant="outline">CSV</Button>
	</div>
</div>
