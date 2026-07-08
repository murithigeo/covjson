# @murithigeo/covjson-core

## Issues

### Temporal Values

Will only support the `Gregorian` calendar. Developers are advised to transform these values into Gregorian first

### Vertical Values

The `referencing` member allows definition of the semantics of z values. This project uses `proj4` for conversions.

Consider the issue [Getting wrong results for converting to EPSG: EPSG:28992 #417](https://github.com/proj4js/proj4js/issues/417#top).

Thus, a workaround has been implemented. If `id` is missing in the `VerticalRS` system object, or if the system declaring the `z` coordinate is a non-verticalRS, then values are assumed to be in meters. The output will be coerced to `EPSG:5773` (meters).

### Reprojections

~ core/domains/\_reproject

Issues may be noted trying to convert 'Grid' or other domains having unequal lengths of the `x`,`y` values. If the lengths of the values of these axes are unequal then the nearest value will be used as a placeholder to reproject these values. And because the output of reprojections is dependent on relationship between x,y. Conversions to and from may result in errors

### API

#### Cloning

Allows creation of classes with deep copies of the arguments.

```ts
const original=getDomain(...).clone();
original instanceof Point;
```

#### Reprojection

Data can be reprojected easily and uses [](https://spatialreference.org) to load OGC WKT 2 definitions. Upon loading, they are cached to reduce network requests. Check out [@murithigeo/uriproj](https://github.com/murithigeo/uriproj) for more info

Modifies the domain/coverage/coveragecollection in place

```ts

let referencing=await Referencing.load({crsId:"EPSG:32737"}); // This also instantiates the source crs as OGC:CRS84

// Synchronously. Because it is destructive pass the `true` option to ignore internal referencing properties
const domain=domain.reproject(referencing,true); // Pass true to ignore the domain's referencing

// Asynchronously
// Loads the passed options and infer source definitions from the domain's referencing member. Optimal for remote data sources
new Grid({...}).reproject({crsId:"EPSG:32737"}).then(domain=>{...});
new Grid({...}).reproject(referencing).then(domain=>{...})

// For CoverageCollections, run the method asynchronously to ensure that all data has the same referencing
new CoverageCollection({...}).reproject({crsId:"EPSG:32737"}).then(collection=>{...})
```

#### Axis Normalization/Denormalization

For some domains, some axes can be expresssed as regularly spaced axes.

```ts
// Attempts to normalize provided that the axes values are regularly spaced
const grid=new Grid({...,axes:{x:{values:[0,1,2,3,4,5]}}}).normalize()
grid.axes.x==={start:0,stop:5,num:6}

// Denormalization works inversely
const grid=new Grid({...,axes:{x:{values:{start:0,stop:5,num:6}}}}).denormalize()
grid.axes.x==={values:[0,1,2,3,4,5]}
```

#### GeoJSON Interoperability
Given that the standard can be considered a subset of GeoJSON, Domain classes provide a getter "geometry" which returns the domain as a geometry, Coverages provide a "feature" getter which wraps the domain's geometry and the Coverage instance itself as the properties object. Finally the CoverageCollection has "featureCollection" which collates the Coverages' "feature" into a list
