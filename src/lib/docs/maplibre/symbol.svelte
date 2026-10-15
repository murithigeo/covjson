<script lang="ts" generics="D extends Domain">
	import { Coverage } from '#lib/core/coverage.ts';
	import type { InferDomainClass } from '#lib/core/index.ts';
	import type { Domain } from 'coveragejson';
	import type { ComponentProps } from 'svelte';
	import { SymbolLayer, type LayerClickInfo, getSource } from 'svelte-maplibre';
	import type { CovJsonCommonLayerProps } from './types';
	import type { MaplibrePlugin } from '#lib/plugin-maplibre/plugin.ts';
	import type { SymbolLayerSpecification } from 'maplibre-gl';

	let {
		onclick,
		oncontextmenu,
		ondblclick,
		onmouseenter,
		onmouseleave,
		onmousemove,
		...props
	}: CovJsonCommonLayerProps<D> & {
		paint?: SymbolLayerSpecification['paint'] | undefined;
		layout?: SymbolLayerSpecification['layout'] | undefined;
		applyToClusters?: boolean | undefined;
	} = $props();
</script>

<SymbolLayer {...props}></SymbolLayer>
