import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    expect: { requireAssertions: true },
    setupFiles: ["./vitest.setup.ts"],
    name: "core",
  },
});
