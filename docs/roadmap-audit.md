# Roadmap Audit

This audit reflects the repository state inspected on 2026-05-23. It is scoped to the public APIs and roadmap items currently documented in `README.md`, without proposing unrelated features.

## Already Implemented

- Stable package entrypoints are present for the root package, `./react`, `./geometry`, and `./materials`, with `./experimental/tsl` kept separate in `package.json` and `tsup.config.ts`. The root export surface includes React components, geometry helpers, material helpers, and public types in `src/index.ts`.
- React components are implemented and exported: `VectorPath3D`, `NeonCurve`, `CalligraphyRibbon`, `MotionTrail`, `FeatheredPlane`, and `TubePath3D` in `src/react.ts` and `src/components/*`.
- Geometry helpers are implemented and exported: `buildRibbonGeometry`, `buildStableFrames`, `buildTubePathGeometry`, `sampleCurve`, `compactPoints`, and `toVector3Array` in `src/geometry.ts` and `src/geometry/*`.
- Material helpers are implemented and exported: `createFeatheredRibbonMaterial`, `updateMaterialUniforms`, `createGradientLineMaterial`, and `createNeonMaterial` in `src/materials.ts` and `src/materials/*`.
- World-unit dash spacing is implemented through `DashStyle.units` in `src/types.ts`, `pathDistance` attributes from `buildRibbonGeometry`, GLSL uniforms in `createFeatheredRibbonMaterial`, and TSL node material logic in `createTslRibbonMaterial`. The README documents both progress and world dash semantics.
- Ribbon geometry emits `position`, `normal`, `uv`, `pathProgress`, `pathDistance`, `side`, and `width` attributes, plus indexed triangles and bounds, in `src/geometry/buildRibbonGeometry.ts`.
- Sampling handles Catmull-Rom and polyline paths, closed paths, duplicate or invalid points, epsilon compaction, and distance/progress output in `src/geometry/sampleCurve.ts`.
- Current frame transport is a simple stable parallel-transport-style implementation with `up`, `billboard`, and `epsilon` options in `src/geometry/frames.ts`.
- `TubePath3D` and `buildTubePathGeometry` exist as a basic tube path implementation backed by `THREE.TubeGeometry`.
- The experimental WebGPU/TSL material adapter exists as `createTslRibbonMaterial` under `src/experimental/tsl.ts`, and the benchmark can compare GLSL/WebGL and TSL/WebGPU paths.
- Tests cover public API exports, geometry robustness, material normalization, world dash behavior, and TSL factory exposure in `tests/public-api.test.ts`, `tests/geometry.test.ts`, `tests/sampling.test.ts`, and `tests/materials.test.ts`.
- The example app exercises the main component set and controls for width, feather, glow, dashes, dash units, and gradient colors in `examples/vite-r3f-demo/src/main.tsx`.
- The benchmark app measures scene build and frame metrics across renderer/material modes in `examples/benchmark/src/main.ts`.

## Partially Implemented

- More robust frame transport is partially addressed by `buildStableFrames`, but the README still calls out difficult closed 3D curves as a limitation and roadmap item. The current implementation transports frames forward through sampled tangents but does not solve closed-loop holonomy or globally minimize twist.
- Hybrid ribbon/tube work is partially addressed by having separate ribbon and tube APIs. `VectorPath3D` and `TubePath3D` share sampling concepts, but there is no single component or helper that transitions between ribbon and tube behavior or exposes a unified hybrid style.
- Motion trails exist through `MotionTrail`, but they rebuild a single ribbon from retained points. There is no instanced trail implementation.
- Glow exists as shader alpha falloff and additive blending in `NeonCurve`, `createNeonMaterial`, and `createFeatheredRibbonMaterial`, but README explicitly says it is not postprocessing bloom. There is no particle-assisted glow path.
- TSL/WebGPU support exists and is benchmarked, but it remains intentionally experimental and outside SemVer guarantees per the README and `./experimental/tsl` entrypoint.
- Public API compatibility has explicit tests, but there is no doc-level compatibility policy beyond the README statement that `./experimental/tsl` is unstable.

## Missing Relative To The Roadmap

- A production-grade frame transport strategy for difficult closed 3D curves, including closed-loop twist correction, stronger pathological-path tests, and visual examples.
- A designed hybrid ribbon/tube API. The current code has `VectorPath3D` and `TubePath3D`, but not a hybrid component or style model.
- Instanced trail variants. `MotionTrail` is a convenient component, not an instanced renderer for many trails.
- Particle-assisted glow variants. Current glow is material-based alpha falloff and additive blending only.
- Promotion path for TSL/WebGPU. The adapter exists, but there is no stable `./materials` export, compatibility matrix, or feature parity contract with the GLSL material.
- Benchmark scenarios for the missing roadmap items. The benchmark currently stresses many ribbon paths and GLSL/TSL material choices, but not instanced trails, particle glow, frame-transport edge cases, or hybrid tube/ribbon rendering.

## Safe Incremental Improvements

- Add more tests around existing behavior without changing APIs: closed-path frame continuity, high-curvature world dashes, tube empty inputs, and TSL option parity.
- Extend the benchmark with saved presets or URL examples for current GLSL versus TSL ribbon cases, keeping the same controls and entrypoints.
- Improve README wording around roadmap status so implemented items like world-unit dashes and basic tube paths are clearly separated from remaining work.
- Add visual examples for existing APIs, such as closed ribbons, object billboarding, custom width profiles, and `TubePath3D`, without changing runtime behavior.
- Add internal helper tests for `buildStableFrames` and `buildTubePathGeometry` based on existing public functions.
- Document that `widthCallback` is backward-compatible while `customWidthProfile` is preferred, matching `src/types.ts` and normalization behavior.

## API Design Decisions Required

- Frame transport: decide whether the public API should expose a transport mode, closed-loop correction setting, initial frame controls, or keep improvements internal to `buildStableFrames`.
- Hybrid ribbon/tube: decide whether this is a new component, new geometry helper, new mode on `VectorPath3D` or `TubePath3D`, or a material/geometry composition pattern.
- Instanced trails: decide ownership of per-trail data, update cadence, maximum trail length, color/width variation, and whether the API is React-first or geometry/material-first.
- Particle-assisted glow: decide whether particles are built into `NeonCurve`, exposed as a separate component, or left to users as a composition recipe.
- TSL promotion: decide the stable export name, package entrypoint, supported three.js versions, renderer requirements, and parity expectations with `createFeatheredRibbonMaterial`.
- Materials: decide whether GLSL and TSL options should share one public options type forever, or split if WebGPU-specific capabilities diverge.

## Potential Breaking Changes

- Changing default frame transport behavior can visually change existing ribbons, especially closed or strongly 3D paths.
- Renaming or removing `widthCallback`, flat dash options (`dashed`, `dashSize`, `gapSize`, `dashPhase`), or the `"catmullrom"` curve alias would break documented backward-compatible APIs.
- Promoting TSL by moving or renaming `./experimental/tsl` could break early adopters unless the experimental path remains as an alias.
- Changing geometry attribute names or meanings (`pathProgress`, `pathDistance`, `side`, `width`) would break custom materials and current TSL/GLSL material logic.
- Replacing `TubePath3D` defaults or its `material` ownership behavior would affect callers that rely on the current `MeshBasicMaterial` fallback or caller-owned material disposal semantics.
- Switching glow from shader alpha falloff to particles or bloom by default would change render order, blending, performance, and scene integration behavior.

## Recommended Implementation Order

1. Lock down the current stable surface with additional tests and docs before adding new roadmap APIs.
2. Improve `buildStableFrames` internally and add closed-curve regression tests while preserving current option names and defaults.
3. Expand benchmark coverage for current ribbons, world dashes, closed curves, and TSL parity so later changes have comparison points.
4. Design the hybrid ribbon/tube API in a small proposal before implementation, because the choice affects component props, geometry helpers, and docs.
5. Implement hybrid ribbon/tube support behind additive APIs, not by changing `VectorPath3D` or `TubePath3D` defaults.
6. Design instanced trails separately from `MotionTrail`; keep `MotionTrail` as the simple compatibility component.
7. Prototype particle-assisted glow as a separate additive component or recipe before considering integration into `NeonCurve`.
8. Promote TSL/WebGPU only after option parity, benchmark coverage, renderer requirements, and fallback behavior are documented.

## Prioritized Checklist

- [ ] Add frame-continuity and closed-curve tests for `buildStableFrames` and `buildRibbonGeometry`.
- [ ] Add benchmark presets or scenarios for world dashes, closed paths, and GLSL/TSL parity.
- [ ] Update README roadmap wording to distinguish shipped world dashes and basic tube paths from remaining hybrid work.
- [ ] Draft a hybrid ribbon/tube API proposal with compatibility notes.
- [ ] Implement hybrid support as additive exports after the API shape is settled.
- [ ] Draft an instanced trail API that does not replace `MotionTrail`.
- [ ] Prototype particle-assisted glow as a separate optional path.
- [ ] Define TSL promotion criteria, then promote with an alias for `./experimental/tsl`.
