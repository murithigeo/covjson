import { type Coverage } from '#lib/core/index.ts';
import type { MetadataRenderProps } from '#lib/ui/metadata/types.d.ts';
import type { Snippet } from 'svelte';

export interface DashboardProps extends PartialBy<MetadataRenderProps<Coverage[]>, 'data'> {
	/**
	 * Point this to the layer's onIndicesChange func
	 */
	onIndicesChange?: (
		coverage: Coverage | ReturnType<Coverage['denormalize']>,
		data: DataRow
	) => void;
	children?: Snippet;
}
type Formatter<T extends string | number> = (val: T) => T;

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
