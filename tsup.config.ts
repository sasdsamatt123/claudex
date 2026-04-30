import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  shims: true,
  dts: false,
  splitting: false,
  sourcemap: false,
  minify: false,
  banner: { js: "#!/usr/bin/env node" },
  loader: { ".json": "copy" },
  publicDir: "src/templates",
});
