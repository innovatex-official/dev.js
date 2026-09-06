import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/client.ts", "src/jsx-runtime.ts", "src/testing.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  splitting: false,
});
