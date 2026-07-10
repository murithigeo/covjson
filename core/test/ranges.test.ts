import { describe, it, expect } from "vitest";
import { NdArray } from "../src/index.ts";

describe("Simple NdArray", () => {
  const ndarr = new NdArray({
    type: "NdArray",
    dataType: "float",
    axisNames: ["t", "z", "y", "x"],
    shape: [1, 1, 2, 3],
    values: [0.5, 0.6, 0.4, 0.6, 0.2, null],
  });

  it("Retrieves correct values for 0,0,0", async () => {
    expect(await ndarr.get({ x: 0, y: 0 })).toBe(0.5);
    expect(await ndarr.get({ x: 2, y: 1 })).toBe(null);
  });
  it(".normalizedNamedIndices: Missing indices are set to 0 and indices are set to [0,...[shape[i]]", () => {
    expect(ndarr.normalizeNamedIndices({ x: 4, y: 0 })).toEqual([0, 0, 0, 2]);
    expect(ndarr.normalizeNamedIndices({ x: 3, y: -1 })).toEqual([0, 0, 0, 2]);
  });

  it(".vLength: Is product of shape", () => {
    expect(ndarr.vLength).toBe(ndarr.shape.reduce((l, r) => l * r));
  });
  it(".tileSets should be undefined", () => {
    expect(ndarr.tileSets).toBe(undefined);
  });
});

describe("TiledNdArray", () => {
  const ndarr = new NdArray({
    type: "TiledNdArray",
    dataType: "integer",
    axisNames: ["t", "y", "x"],
    shape: [2, 5, 10],
    tileSets: [
      {
        tileShape: [null, 2, 3],
        urlTemplate:
          "https://covjson.org/playground/coverages/grid-tiled/a/{y}-{x}.covjson",
      },
      {
        tileShape: [1, null, null],
        urlTemplate:
          "https://covjson.org/playground/coverages/grid-tiled/b/{t}.covjson",
      },
      {
        tileShape: [null, null, null],
        urlTemplate:
          "https://covjson.org/playground/coverages/grid-tiled/c/all.covjson",
      },
    ],
  });

  it(".fillNulls", () => {
    expect(ndarr.fillNulls(ndarr.tileSets![2].tileShape)).toEqual([2, 5, 10]);
  });
  it(".tileEffort", () => {
    expect(ndarr.tilesetEffort(ndarr.tileSets![0])).toBe(12);
  });
  describe(".intersects", () => {
    it("Matches all tileSets for 0,0,1", () => {
      expect(ndarr.tileSets!.filter(ndarr.intersects([0, 0, 1])).length).toBe(
        3,
      );
    });
    it("matches two tileSets for 1,5,10", () => {
      expect(ndarr.tileSets!.filter(ndarr.intersects([1, 5, 10])).length).toBe(
        2,
      );
    });
    it("matches one tileSet for 2,5,10", () => {
      expect(ndarr.tileSets!.filter(ndarr.intersects([2, 5, 10])).length).toBe(
        1,
      );
    });
  });
  it.skip("get:tileSets", () => {
    expect(ndarr.tileSets).toBeDefined();
  });
  it.skip(".appendRange", () => {});
  it.skip(".loadTileSet", () => {});
  it.skip(".getTileCombos", () => {});
  it.skip(".getBestTile", () => {});
});
