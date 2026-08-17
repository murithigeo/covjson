import { LineProps } from 'layerchart';
/**
 * Default options for charts provided a domainType
 */

import type { DomainTypes } from 'coveragejson';

export const chartPresets = {
	VerticalProfile: {
		x: 'z',
		props: {}
	}
} satisfies Partial<Record<NonNullable<DomainTypes>, {}>>;
