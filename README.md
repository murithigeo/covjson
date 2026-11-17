# CoverageJSON Suite

Improves on the [covutils](https://github.com/Reading-eScience-Centre/covutils),[covjson-reader](https://github.com/Reading-eScience-Centre/covjson-reader) and [leaflet-coverage](https://github.com/Reading-eScience-Centre/leaflet-coverage) projects by Reading eScience Center.

## Disclaimer

This project is still in Alpha. It should not be used in production environments, although the public release will happen soon

## API

```ts
import { Coverage, CoverageCollection } from '@murithigeo/covjson/core';

import { MaplibrePlugin } from '@murithigeo/covjson/plugin-maplibre';

// For non-svelte environments
import '@murithigeo/covjson/parameter.js';
import '@murithigeo/covjson/coverage.js';
import '@murithigeo/covjson/parameter-group.js';
import '@murithigeo/covjson/covjson.css';

//Svelte
import '@murithigeo/covjson/covjson.css';
import Coverage from '@murithigeo/covjson/coverage';
import ParameterGroup from '@murithigeo/covjson/parameter-group';
import Parameter from '@murithigeo/covjson/parameter';
```
