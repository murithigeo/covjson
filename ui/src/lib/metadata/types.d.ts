import type { ClassValue } from 'clsx';
export type MetadataRenderProps<T, Plus extends Record<string, unknown> = {}> = Plus & {
	data: T;
	class?: ClassValue;
};

// Source - https://stackoverflow.com/a/61108377
// Posted by Tim Krins, modified by community. See post 'Timeline' for change history
// Retrieved 2026-08-28, License - CC BY-SA 4.0

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
