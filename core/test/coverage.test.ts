import { describe, it, expect } from "vitest";
import { Coverage } from "../src/coverage.ts";

describe("Reprojections", async () => {
  const cov = await Coverage.load(
    "https://covjson.org/playground/coverages/grid-tiled.covjson",
  );
  const clone = await cov.clone().reproject({ crsId: "EPSG:32738" });
  it("Replaces the connection object", () => {
    expect(
      clone.domain.referencing?.find((e) =>
        e.coordinates.some((el) => ["x", "y"].includes(el)),
      )?.system.id,
    ).toBe("http://www.opengis.net/def/crs/EPSG/0/32738");
  });
  it("#getter referencing returns the replaced referencing object", () => {
    expect(clone.referencing).toBeDefined();
  });
});

describe("High load tests", () => {
  describe("Grid", async () => {
    const cov = await Coverage.load(
      "https://covjson.org/playground/coverages/grid-tiled.covjson",
    );
    it(".queryIndices: Fast and accurate", () => {
      expect(cov.queryIndices([-100, 50])).toEqual({ x: 0, y: 4,z:0 });
    });
    it(".queryData from TileSets", async () => {
      await expect(cov.getData([-100, -50], ["FOO"])).resolves.toEqual({
        FOO: 1,
      });
      await expect(cov.getData([100, 50], ["FOO"])).resolves.toEqual({
        FOO: 50,
      });
    });
  });
});

describe("GeoJSON Mappings", async () => {
  const cov = await Coverage.load(
    "https://covjson.org/playground/coverages/grid-tiled.covjson",
  );
  it("the properties object is the class itself", () => {
    expect(cov.feature.properties).toEqual({
      domainType: "Grid",
      id: cov.uuid,
    });
  });
});
