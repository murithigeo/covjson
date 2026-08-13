import type { Coverage } from '@murithigeo/covjson-core';
export const preload = (cov: Coverage, pageWith: 'z' | 't' = 't'): string[] => {
	const axisNames: string[] = [];

	switch (cov.domain.domainType) {
        case 'Grid':
            if(cov)
    }
    return axisNames;
};
