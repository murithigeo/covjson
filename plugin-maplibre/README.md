# @murithigeo/covjson-maplibre

A plugin that handles handles CoverageJSON to GeoJSON mappings necessary to render CoverageJSON data in maplibre-gl.

It is a barebones implementation. So no Temporal Control, charts etc and the map interface real-estate is iffy so I would rather not

## Install

```sh
npm i @murithigeo/covjson-maplibre
```

## API

This implementation extends the inbuilt GeoJSON source so you don't have to implement custom functionality for the same level of experience

```ts
import {MaplibrePlugin} from "@murithigeo/covjson-maplibre";
import maplibregl from "maplibre-gl";

const {addSourceType}=maplibregl;
// In TS, there will be an error here because the PluginOptions conflict with GeoJSON Source Options
maplibregl.addSourceType("coveragejson",MaplibrePlugin)
.catch(err=>{
    // For dev HMR environments, this may be necessary to prevent crashes
})

// Now you can pass a Coverage, Domain, CoverageCollection object or URL resolving to one of these objects.

const map=new Map(...);
map.on("load",()=>{

map.addSource(`<source-id>`,{
    type:"coveragejson",
    data: "https://covjson.org/playground/coverages/grid-bng-domain.covjson",
    // Pass layer IDs derived from this source so that the plugin can attach listeners that automatically populates e.coverages key
    layerIds:["layerId1","layerId"],
})
})

map.addLayer({
    id:"layerId1",
    source:"<source-id>",
    type:...,
    paint:{...},
    filter:["in",["get","domainType"],["literal",["Point"]]] // The coverage to GeoJSON.Feature mapping only includes "id" and "domainType"
})

// You can then listen on events normally
map.on("click","layerId1",(e)=>{
    console.log(e.coverages); // Note that each coverage will have the "indices" member computed. Refer to the `Coverage` class for more info
})

// Alternatively, you can handle the logic yourself
map.on("click","layerId1",(e)=>{
    const source=map.getSource<MaplibrePlugin>("<source-id>");

    const point=e.point.wrap(); // Wrap so that lngs are in [-180,180]
    // Get the coverages and compute indices

    const coverages=source.getCoveragesFromFeatureList(e.features,[point.lng,point.lat])
})

// Getting the loaded CoverageJSON
const source=map.getSource<MaplibrePlugin>(sourceId);
const coveragecollection=source.getCovData();

// From there, you can do what you want
```

## Limitations

All work is done on the main thread. Working on using `importScriptInWorkers` to mitigate this.

Grids are mapped to MultiPolygons so if you need to style individual grid cells, you have to implement that functionality.

## Workarounds
In Svelte, note that while each event will recalculate the indices of `x/y` note that this will not trigger reactivity.

So do:
```ts
let coverage=$state<Coverage>();

// Assumes that the listenTo includes the "click" listener
map?.on("click",<layerId>,(e)=>{
    if(coverage)coverage=undefined;
    coverage=coverages[0];
})
```