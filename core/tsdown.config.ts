import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: "./src/index.ts",
    format: "esm",
    outDir: "dist",
  },
  { entry: "./src/index.ts", format: "iife", name: "CovJsonCore" },
]);
