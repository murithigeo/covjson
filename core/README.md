# @murithigeo/covjson-core

## API
Most of these objects have a  `toPlain` method allowing you to get a plain CoverageJSON document

### Domain

Creating a new Domain class

```ts
const grid=new Grid({...domainType:"Grid",...});
// or
 grid=getDomain({...});
```

Create a copy of the domain's internals and return a new class.
Useful before calling destructive methods such as [de]normalization

```ts
const clone = grid.clone();
// Modifying this wont affect the original grid
clone.axes.x = { values: [20, 30] };
```

Reproject the axis coordinates to a different crs

```ts
const referencing = await Referencing.load({ crsId: "OGC:CRS27" }, []);

// Pass force=true to ignore and overwrite any referencing system connections inside the domain
// Useful for when the CoverageCollection's domains are in the same CRS
grid.reproject(referencing, true);
// Pass false as second argument or ignore to ensure domain's referencing is not ignored
await grid.reproject(referencing);
```

Convert any applicable axis objects to and from a RegularlySpacedAxis

```ts
grid.normalize(); // Resulting axis values become a RegularlySpacedAxis only if they are strictly monotonic
grid.denormalize(); // Converts any Regularly Spaced Axis objects to a values object
```

Get the indices of horizontal (x,y) values relative to a reference point i.e. the click point of a map

```ts
const indices = grid.queryIndices([0, 0]); // {x:0,y:0}  or {composite:0}
```

//Get the horizontal components of the domain as a GeoJSON geometry

```ts
const multipolygon = grid.geometry;
```

### Coverage
Init a new Coverage Class
```ts
// Requires that domains and ranges are objects instead of URLs
let coverage=new Coverage(...,domain:{...},ranges:{FOO:{}})
// or use the static load method when unsure
coverage=await Coverage.load({...,domain:"https://covjson.org/playground/coverages/grid-tiled.covjson"});
```

Querying data
```ts
// If second argument is not provided, then data is fetched for all ranges in coverage
// All range/parameter keys are in uppercase
let data=await coverage.getData([0,0]); // calls the domain's queryIndices to get a hashmap of the horizontal components
// If a non-existent rangeId is included, then it's value is undefined
{FOO:1,BAR:undefined}

// Alternatively, bypass queryIndices
data=await coverage.getData({x:0,y:0,t:0});

```


### CoverageCollection
Init
```ts
let collection=new CoverageCollection({...});
// or 
collection=await CoverageCollection.load({...});
```
Querying the data
```ts
let data=await collection.getData([x,y],["FOO","BAR"]) // [{"FOO":1,BAR:undefined}]
```

### NdArray/TiledNdArray

The options
```ts
interface Options{
    // When true, loads the entire tileset on match instead of the relevant tile
    eagerLoad?:boolean//default: false
    // Function to transform ndarray values elements. Called once when ndarray is loaded
    // Useful for converting values between Units of measure
}
```

From named indices to ndarray indices
```ts
let ndarray=new NdArray({...,shape:[2,5,10],axisNames:["t","x","y"]});

let indices={x:0,y:0};
const liIndices=ndarray.normalizeNamedIndices(indices);
liIndices===[0,0,0];
```

Getting the actual value
```ts
let value=ndarray.get(indices);
// If the ndarray is tiled and the value is undefined, then what slice of data to load is determined and loaded
// Is not recursive incase the logic to determine and load tile is not robust
```
Get the tilesets that intersects with the indices
```ts
let tilesets=ndarray.intersects(...);
```

### Parameters
I18N
```ts
// The second argument is your preferred locale
let label=new I18N({en:"FOO","en-KE":"BAR"},"en");

// Language Tags in the object
const langs=label.locales;

// Get the value of a string in the preferred language. If an arg is not provided, falls back to the second argument of the constructor or "en"
let {value,tag}=label.query(); // tag==="en";value==="FOO"
```

Parameter
```ts
let parameter=new Parameter({...,label:undefined})
```