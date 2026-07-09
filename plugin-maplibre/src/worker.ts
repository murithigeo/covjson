// import type { Coverage as Cov, CoverageCollection, Domain } from '../coveragejson.d.ts';
// import type { Coverage } from "../coverage.ts";
// import type { Referencing, UserReferencingOptions } from '../referencing.ts';
// import maplibregl from "maplibre-gl";

// Scenarios to handle
// Reprojection to CRS84
// Domain/Coverage/CoverageCollection Loading and maybe tileSets loading?(need a custom protocol for this though)
// self.registerWorkerSource("coveragejson", async (e) => {
//     console.log(e)
// })

onmessage = (e) => {
    console.log(e.data)
}