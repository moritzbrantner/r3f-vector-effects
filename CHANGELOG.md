# Changelog

## Unreleased

## 0.2.0

- Added `LICENSE` and `RELEASING.md` for npm release readiness.
- Added `pack:smoke` package-consumer validation for ESM imports, CJS imports, and TypeScript
  declaration consumption.
- Added `TubePath3D`, a React component backed by `buildTubePathGeometry`.
- Added `DashStyle.units: "progress" | "world"` and world-unit dash spacing for ribbon materials.
- Added a `pathDistance` geometry attribute alongside `pathProgress`.
- Fixed `VectorPath3D` so `customWidthProfile` and `widthCallback` affect generated geometry.
- Updated the demo with dash unit controls and a tube path example.
- Expanded README API documentation and usage examples.

- Added explicit `./react`, `./geometry`, `./materials`, and `./experimental/tsl` package
  entrypoints.
- Changed path dash configuration from `dashed`, `dashSize`, and `gapSize` props to a single
  `dash` object.
- Changed `VectorPath3D` billboarding from boolean `billboard` to `billboardMode`.
- Added shared option normalization for sampling, ribbon styles, dash styles, materials, and
  feathered planes.
- Split shader source into reusable modules.
- Added an experimental TSL/WebGPU ribbon material factory behind the `./experimental/tsl`
  subpath.
- Added CI coverage for linting, typechecking, tests, package build, example builds, benchmark
  build, and package dry-run checks.
- Expanded tests for public API entrypoints, degenerate sampling, geometry bounds, width callback
  safety, frame stability, material defaults, and invalid numeric options.

## 0.1.0

- Initial package scaffold.
- Added `VectorPath3D`, `NeonCurve`, `CalligraphyRibbon`, `MotionTrail`, and `FeatheredPlane`.
- Added ribbon geometry sampling, stable frame helpers, and simple tube path geometry.
- Added feathered ribbon, gradient line, and neon shader material factories.
- Added Vitest coverage for geometry, sampling, and material contracts.
- Added Vite React Three Fiber demo app.
