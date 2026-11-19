# CoverageJSON Suite

Improves on the
[covutils](https://github.com/Reading-eScience-Centre/covutils),[covjson-reader](https://github.com/Reading-eScience-Centre/covjson-reader)
and
[leaflet-coverage](https://github.com/Reading-eScience-Centre/leaflet-coverage)
projects by Reading eScience Center.

## Disclaimer

This project is still in Alpha. It should not be used in production
environments, although the public release will happen soon

## API

This project is not a monorepo but exports are sub-path, thus importing what you
need from each module

### Core

To get Coverage, Domain or CoverageCollection classes, do:

```javascript
import {Coverage,getDomain,Grid} from "@murithigeo/covjson/core"

let dom={type:"Domain",axes:{x:{values:[10,20]},y:{values:[20,21]}}}

// This infers the domainType and returns the correct class.
let domain=getDomain(dom)

// You can also get the domain directly
domain=new Grid(dom)

// All classes implement a .toJSON method to serialize everything to a plain object
domain.toJSON() // {type:"Domain",axes:{...}}

// The Coverage, Domain, CoverageCollection  implement the .clone method to return a "disconnected" copy of the class
let domainCopy=domain.clone()

// Use the Coverage.load method if you are unsure if the .domain is a string or object
let cov=await Coverage.load({type:"Coverage",domain:"...",ranges:{}}) // Also resolves ranges which are URLs

// Or instantiate a new class directly
cov=new Coverage({...,ranges:{...}}); // If any of the ranges are strings, they are loaded when data is first queried.

let coveragecollection=CoverageCollection.load({...}); // Similar to Coverage.load
```

There are two ways to query data

```typescript
// Use a 2D or 3D point
let data=await getData([36, 1, 1000],options);

// a datetime string
data=await getData("2021",options);

// or an elevation
data=await getData(1000)

// Where the options are:
let options={
    cb: (rangeId,range)=>{}// Callback that is executed when a value in a TiledNdArray has been freshly loaded
    ranges: Array<string>() // Only fetch data from these ranges
    axisNames:{} // For which indices is the data fetched?
}

// And where the data is
type DataRow={
    [x: axisName]: number // Just an index
    [x:string]: null|string|number // The value itself
}
```

You can also reproject your domain, coverage, coveragecollection

```ts
// Use another .referencing array or use an object
dom.reproject({
    crs: {
        id: "EPSG:327237",
    },
    vrs: {
        id: "EPSG:5714",
        fn: (v) => v, // Provide a custom converter function or it will be inferred from the .id property and data loaded by @murithigeo/uriproj
    },
    trs: {
        calendar: "",
        timeScale: "",
    },
});
```

And if you can ensure the axes of your Coverage,Domain,Collection objects are
Regular Spaced or Irregular Spaced using:

```ts
// These methods modify everything in place so use .clone whenever that is undesired

// Convert to {values:[...]} whenever possible
dom.denormalize();
// Convert axes to the RegularSpacedAxis whenever possible
dom.normalize();
```

### Plugin-Maplibre

Make sure you have Maplibre available and loaded

```ts
import {Map,addSourceType} from "maplibre-gl"
// Register the plugin
addSourceType("coveragejson",MaplibrePlugin).then(()=>{ // Do something
}).catch(()=>{
    // In dev environments with HMR, you will need to catch the Plugin already registered
})
let map=new Map({...});
map.on("load",(map)=>{
    map.addSource("coveragejson",{...options});
})
```

### Plugin-UI

Written as custom web components and in Svelte, this ensures that components are usable in almost all frameworks.

#### Vanilla

Also applies to frameworks although they do support inline variables

```html
<body>
	<script type="module">
				import { Coverage } from './dist/core/index.js';
				import './dist/plugin-ui/client/Coverage.js';

				      let coverage=await Coverage.load({...});

				      const element=document.createElement("covjson-coverage");

				            element.formatters={

				              axis: (domainType,index,{value,mode})=>["UK","Germany"][i],// Label a Polygon axis value based on its axis index
				                    value:(parameterId,value)=>`${value}°C`// Format a range value
				            };

				                        element.axisNames={t:true // Load everything in this axis
				                        }
				                              element.config={
				                                  x: "x" // Use as chart x-axis
				                              }
				                  element.addEventListeners("IndicesChange",({detail:{coverage,indices}})=>{
		// When the tooltip is defined
				                  });

								  // Or alternative <covjson-coverage onIndicesChange={({detail})=>{}}>

				            document.body.append(el);
	</script>
</body>
```

#### Frameworks

Some environments such as SSR will necessitate some extra configuration. This example is for usage in Svelte but configurations in other frameworks should be similar. For more info, see [SSR Overview on SvebComponents](https://svebcomponents.dev/server-rendering/)

```ts
// Svelte
// layout.svelte Only import once app-wide
import "@murithigeo/covjson/plugin-ui/parameter";
import "@murithigeo/covjson/plugin-ui/coverage";
import "@murithigeo/covjson/plugin-ui/parametergroup";

// hooks.server.ts //Should not be necessary when ssr/prerendering is set to false in +layout.ts
import "@murithigeo/covjson/plugin-ui/parameter/ssr"
import "@murithigeo/covjson/plugin-ui/parameter/ssr";
import "@murithigeo/covjson/plugin-ui/parameter/ssr";

// vite.config.ts
import svebcomponents from "@svebcomponents/ssr/vite"
export default defineConfig({...,plugins:[svebcomponents(),sveltekit({...})]})
```

```svelte
<script>
import {Parameter} from "@murithigeo/covjson/core"
</script>
<covjson-parameter parameter={new Parameter({...},"key")} color={{default:"red"}} ...>
</covjson-parameter>

```
