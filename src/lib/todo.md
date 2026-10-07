# Tasks

## UI

-[] Optionally pass the range to the [`table-cpt`](./ui/coverage/table-cpt.svelte) so that it can load all data at once similar to how `coverage-cpt` is set up
-[] Fix overflow for [tres-dashboard`](./ui/dashboards/tres-dashboard-cpt.svelte#43)
-[] Implement [global LayerChart](./ui/dashboards/utils/control-center.svelte) brush for all coverages. Opt coverages into the brushes contigent on which dimensions they use. Necessitates knowing which data to render for the brush
-[] Write docs alongside web-component usage examples
-[] Export components via svebcomponents
-[] Fix tooltips for faceted components
-[] Make the y1 accessor work (multiple splines/otherwise). y1 should also refer to the dimension substitutable with the `x` domain. So Point's (z/t) etc
-[] Restrict MapTiler's token so that mobile/192.168.1.* domains can load the style

# Core

-[] Write up-to-date tests
