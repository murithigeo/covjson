# CoverageJSON Suite

Improves on the [covutils](https://github.com/Reading-eScience-Centre/covutils),[covjson-reader](https://github.com/Reading-eScience-Centre/covjson-reader) and [leaflet-coverage](https://github.com/Reading-eScience-Centre/leaflet-coverage) projects by Reading eScience Center.

## Disclaimer

This project is still in Alpha. It should not be used in production environments, although the public release will happen soon

## Modules

### Core

Contains the low-level code to be used in other modules. The `Coverage`, `CoverageCollection` and Domain classes implement a basic definition allowing asynchronous and synchronous reprojections powered by [spatialreference.org](https://spatialreference.org/), cloning the object etc.

### Maplibre

The Plugin that allows loading CoverageJSON documents directly into MapLibre. Extends MapLibre's GeoJSONSource.

### UI

Svelte-written logic to deliver an interactive experience using Charts and axes configurations (powered by [LayerChart](https://layerchart.com/))

### Converters

Plugins to convert to and from formats such as NetCDF is also in the works
