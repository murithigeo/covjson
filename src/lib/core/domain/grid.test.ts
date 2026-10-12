import { describe, it, expect } from "vitest";
import { Grid, denormalizeNumAxis, load } from "../src/index.ts";
import type { Grid as G, Coverage } from "../src/coveragejson.d.ts";

const grid = await load<G>(
  "https://covjson.org/playground/coverages/grid-domain-bng.covjson",
).then((domain) => new Grid(domain));
describe("Axes [de]normalization", () => {
  const g1 = grid.clone().denormalize();
  it("denormalizes axes", () => {
    expect(g1.axes.x).toEqual({
      values: expect.arrayContaining(denormalizeNumAxis(grid.axes.x).values),
    });
    expect(g1.axes.y).toEqual({
      values: expect.arrayContaining(denormalizeNumAxis(grid.axes.y).values),
    });
  });
  it("normalizes axes if possible", () => {
    const g2 = grid.clone();
    g2.axes.z = { values: [20, 24, 40] };
    g2.normalize();

    expect(g2.axes.x).toEqual(grid.axes.x);
    expect(g2.axes.y).toEqual(grid.axes.y);
    expect(g2.axes.z).toEqual({ values: expect.arrayContaining([20, 24, 40]) });
  });
});
describe.skip("Axes Bounds", () => {});
describe("Reprojection", async () => {
  const clone = (
    await new Grid({
      type: "Domain",
      domainType: "Grid",
      axes: {
        x: { num: 6, start: 0, stop: -5 },

        y: { num: 5, start: 0, stop: 20 },
        z: { values: [10, 20, 30] },
        t: { values: ["2021", "2022", "2024"] },
      },
      referencing: [
        {
          coordinates: ["x", "y"],
          system: { type: "GeographicCRS", id: "OGC:CRS84" },
        },
      ],
    }).reproject({ crsId: "EPSG:32737" })
  ).denormalize();
  it("x/y unequal no. of elements are reprojected correctly", () => {
    expect(clone.axes.x).toEqual({
      values: expect.arrayContaining([
        -4223032.968188589, -4341063.548049857, -4403892.922912131,
        -4406750.002024334, -4347530.238807505, -4478168.887842785,
      ]),
    });
    expect(clone.axes.y).toEqual({
      values: expect.arrayContaining([
        10000000, 10721862.08474643, 11457178.300204441, 12197285.946212519,
        12932369.047493774,
      ]),
    });
  });
  it.skip("returns normalized axis if was normalized", async () => {});
});
describe("Cloning", () => {
  it("toPlain returns unique values", () => {
    const clone = grid.clone();
    clone.axes.x = { values: [20, 30] };
    expect(grid.toPlain()).not.toEqual(clone.toPlain());
  });
});

describe("BBox/Polygon Generation", () => {
  it("Expect that the length of bboxes is exactly x.values.length-1*y.values.length", () => {
    //@ts-expect-error sure we can denormalize but for what
    const len = grid.axes.x.num * grid.axes.y.num;
    expect(grid.bboxes.length).toBe(len);
    expect(grid.polygons.length).toBe(len);
  });
  it.each(grid.polygons.slice(0, 10).map((p, i) => [p, grid.bboxes[i]]))(
    "Expect that each polygon has a bbox property and the bounds are the values of the bboxes",
    (feature, bbox) => {
      expect(feature.bbox).toEqual(bbox);
    },
  );
});

describe("Axis Bounds", () => {
  it("does not generate bounds for regularlyspaced axes", () => {
    const clone = grid.clone().calculateAxesBounds();
    //@ts-expect-error bounds does not exist on regularlyspaced
    expect(clone.axes.x.bounds).toBeUndefined();
  });
  it("generates bounds for denormalized axes", () => {
    const clone = grid.clone().denormalize();
    clone.calculateAxesBounds();
    expect(clone.axes.x.bounds).toBeDefined();
  });
});
