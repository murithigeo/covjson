import type { ClassValue } from 'clsx';
import type { NdArray, ValuesNdArray } from 'coveragejson';
import type { SvelteSet, SvelteMap } from 'svelte/reactivity';
/**
 * How to render properties such as locale objects.
 * "full" means rendering every single locale value.
 * "simple" means rendering one locale. Perfect for limited screen real estate
 * @todo add option to specify which locales to render
 */
export type MetadataRenderDetail = 'simple' | 'full';

export interface MetadataRenderProps<T> {
	data: T;
	/**
	 * Default to simple
	 */
	detail?: MetadataRenderDetail;
	/**
	 *
	 */
	class?: ClassValue;
}
