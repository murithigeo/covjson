import type { ClassValue } from 'clsx';
export type MetadataRenderProps<Data, Plus extends Record<string, unknown> = {}> = Plus & {
	data: T;
	class?: ClassValue;
};
