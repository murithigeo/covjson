import type { InferDomainClass } from '#lib/core/index.ts';
import type { CommonLayerProps, LayerClickInfo } from 'svelte-maplibre';

export interface CovLayerClickInfo<D extends Domain> extends LayerClickInfo<
	Coverage<D>['feature']
> {
	coverages: Coverage<D>;
}
export interface CovJsonCommonLayerProps<D extends Domain = Domain> extends CommonLayerProps<
	Coverage<D>['feature']
> {
	onclick?(e: CovLayerClickInfo<D>): void;
	ondblclick?(e: CovLayerClickInfo<D>): void;
	oncontextmenu?(e: CovLayerClickInfo<D>): void;
	onmouseenter?(e: CovLayerClickInfo<D>): void;
	onmousemove?(e: CovLayerClickInfo<D>): void;
	onmouseleave?(e: Pick<CovLayerClickInfo<D>, 'map' | 'layer' | 'source'>): void;
}
