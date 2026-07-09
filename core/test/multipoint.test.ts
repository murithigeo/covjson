import { describe, it, expect } from "vitest";
import type { Coverage, MultiPoint as MP } from "../src/coveragejson.d.ts";
import { load, MultiPoint } from "../src/index.ts";

const multipoint = await load<Coverage<MP>>(
  "https://covjson.org/playground/coverages/multipoint.covjson",
).then((cov) => new MultiPoint(cov.domain));
describe("MultiPoint tests", async () => {
  describe(".queryIndices", () => {
    it("Returns the composite index of the point closest", () => {
      expect(multipoint.queryIndices([-5.1, -40.2])).toEqual({ composite: 0 });
    });
  });
  describe.skip(".collect tests");
});
