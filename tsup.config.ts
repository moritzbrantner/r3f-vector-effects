import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/react.ts",
    "src/geometry.ts",
    "src/materials.ts",
    "src/experimental/tsl.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom", "three", "three/tsl", "three/webgpu", "@react-three/fiber"],
});
