import { describe, expect, it } from "vitest";
import { Referencing, type UserReferencingOptions } from "../src/index.ts";
import { get, toURI, uriproj } from "@murithigeo/uriproj";
import type {
  ReferenceSystemConnection,
  SpatialReferenceSystem,
} from "../src/coveragejson.d.ts";

let referencing: Referencing;
const options: UserReferencingOptions = {};

describe("crs/conversions always return [lon,lat]", () => {
  let referencing: Referencing;
  const connection: ReferenceSystemConnection<SpatialReferenceSystem> = {
    coordinates: ["x", "y"],
    system: { type: "GeographicCRS" },
  };
  it(`LatLng to LngLat`, async () => {
    options.crsId = "OGC:CRS84";
    connection.system.id = "EPSG:4326";
    referencing = await Referencing.load(options, [connection]);
    expect(referencing.crs([-40.2, -5.1])).toEqual([-40.2, -5.1]);
  });
  it("LatLng to LatLng", async () => {
    options.crsId = "EPSG:4326";
    connection.system.id = "EPSG:4327";
    referencing = await Referencing.load(options, [connection]);
    expect(referencing.crs([-40.2, -5.1])).toEqual([-40.2, -5.1]);
  });
  it("LngLat to LngLat", async () => {
    options.crsId = "OGC:CRS84";
    connection.system.id = "EPSG:32737";
    referencing = await Referencing.load(options, [connection]);
    const pos = referencing.crs([-14031803.849869838, 6977050.339359542]);
    expect(pos[0]).toBeCloseTo(-40.2);
    expect(pos[1]).toBeCloseTo(-5.1);
  });
});
describe("#vrs", () => {
  const connection: ReferenceSystemConnection<SpatialReferenceSystem> = {
    coordinates: ["z"],
    system: {
      type: "GeographicCRS",
    },
  };
  options.vrsId = undefined;
  it("Referencing assumes that vrs multiplier is 1 if system.id undefined", async () => {
    referencing = await Referencing.load(options, [connection]);
    expect(referencing.vrsFactor).toBe(1);
  });
  it("If source is Meters && !vrsId return 1", async () => {
    connection.system.id = "EPSG:5714";
    referencing = await Referencing.load(options, [connection]);
    expect(referencing.vrsFactor).toBe(1);
  });
  it("If source is Ft && !vrsId, multiplier is from source", async () => {
    connection.system.id = "EPSG:5702";
    options.vrsId = undefined;
    referencing = await Referencing.load(options, [connection]);
    expect(referencing.vrsFactor).toBeCloseTo(0.3048);
  });
  it("Correct multiplier for Meters-based VRS to Ft-based VRS", async () => {
    options.vrsId = "EPSG:5702";
    connection.system.id = "EPSG:5714";
    referencing = await Referencing.load(options, [connection]);
    expect(referencing.vrsFactor).toBeCloseTo(1 / 0.3048);
  });
  it("correct multiplier for Ft-based VRS to Ft-based VRS", async () => {
    options.vrsId = "EPSG:5702";
    connection.system.id = "EPSG:6130";
    referencing = await Referencing.load(options, [connection]);
    expect(referencing.vrsFactor).toBeCloseTo(1);
  });
  it("Correct multiplier for Ft-based VRS to Meters based VRS", async () => {
    options.vrsId = "EPSG:5714";
    connection.system.id = "EPSG:5702";
    referencing = await Referencing.load(options, [connection]);
    expect(referencing.vrsFactor).toBeCloseTo(0.3048);
  });
});

describe("load function", async () => {
  const connections: ReferenceSystemConnection[] = [
    {
      coordinates: ["x", "y", "z"],
      system: { type: "GeographicCRS", id: "OGC:CRS84h" },
    },
  ];
  const referencing = await Referencing.load(
    { crsId: "EPSG:32737", vrsId: "EPSG:5773" },
    connections,
  );
  it("replaces the connection object", () => {
    // Also handles the expectation that the coord reference is normalized
    expect(
      referencing.connections.find(
        ({ coordinates }) => coordinates.indexOf("x") !== -1,
      )?.system.type,
    ).toBe("ProjectedCRS");
  });
  it("instantiates vrs,trs,crs connections if none found", () => {
    expect(
      //@ts-expect-error
      connections.find((e) => e.system.type === "VerticalCRS")?.system.id,
    ).toBe(toURI("EPSG:5773"));
  });
  it("replaces the connections array by reference", () => {
    expect(connections[0].system.type).toBe("ProjectedCRS");
  });
});

describe("caching: Requests should be handled by mws", () => {
  it("If the wkt is not in /src/example-data/spatialreference.org, then it is not defined in proj4", async () => {
    await expect(uriproj({ to: "EPSG:32738" })).rejects.toThrow();
    expect(get(toURI("EPSG:32738"))).toBeUndefined();
  });
});
