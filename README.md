# @moritzbrantner/r3f-vector-effects

React Three Fiber components for stylized vector-like effects in 3D scenes: neon curves,
variable-width ribbons, calligraphic strokes, motion trails, dashed paths, path gradients, glow,
and soft-edged HUD panels.

This package is inspired by Redraw-style programmable vector graphics, but it is not a Redraw port
and does not depend on Redraw. The MVP is built around ordinary three.js `BufferGeometry` and
WebGL-compatible `ShaderMaterial` so it can work in existing R3F scenes without requiring WebGPU.

## Why 3D Is Different

2D vector feathering can operate in screen or path space with stable assumptions about the drawing
plane. In 3D, paths have camera perspective, depth testing, curve frames, normals, and self-overlap.
This package treats vector effects as geometry-aware 3D objects first: it builds ribbons or tubes
from sampled paths, writes UV progress into the geometry, then uses small shaders for gradients,
dashes, glow-like alpha falloff, and soft edges.

## Installation

```bash
bun add @moritzbrantner/r3f-vector-effects three react react-dom @react-three/fiber
```

Peer dependencies:

- `react`
- `react-dom`
- `three`
- `@react-three/fiber`

`@react-three/drei` is optional and only used by the example app for orbit controls.

## Basic Example

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { NeonCurve, CalligraphyRibbon } from "@moritzbrantner/r3f-vector-effects";

export function Scene() {
  return (
    <Canvas camera={{ position: [0, 2, 6] }}>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <NeonCurve
        points={[
          [-2, 0, 0],
          [-1, 1, 0],
          [1, -1, 0],
          [2, 0, 0],
        ]}
        color="#66ccff"
        coreWidth={0.04}
        glowWidth={0.3}
        intensity={2}
      />
      <CalligraphyRibbon
        points={[
          [-2, -1, 0],
          [0, 0.5, 0],
          [2, -1, 0],
        ]}
        color="#ffffff"
        width={0.18}
        pressureProfile="middle-heavy"
      />
    </Canvas>
  );
}
```

## Import Entrypoints

The root entrypoint is a convenience surface for common React components and framework-independent
helpers:

```ts
import { VectorPath3D, buildRibbonGeometry } from "@moritzbrantner/r3f-vector-effects";
```

Use subpath entrypoints when you want clearer bundle boundaries:

```ts
import { VectorPath3D } from "@moritzbrantner/r3f-vector-effects/react";
import { buildRibbonGeometry, sampleCurve } from "@moritzbrantner/r3f-vector-effects/geometry";
import { createFeatheredRibbonMaterial } from "@moritzbrantner/r3f-vector-effects/materials";
```

## Components

### VectorPath3D

General-purpose 3D path renderer. It samples points as a Catmull-Rom curve by default, builds a
ribbon mesh, and adds UVs where `u` is path progress and `v` is the cross-path coordinate.

Key props:

- `points`
- `closed`
- `segments`
- `curveType`: `"catmullrom"` or `"polyline"`
- `width`
- `widthProfile`: `"constant"`, `"taper"`, `"calligraphy"`, or `"pulse"`
- `color`, `colorStart`, `colorEnd`
- `opacity`, `feather`, `glow`
- `dash`: `{ enabled, size, gap, phase, units: "progress" }`
- `billboardMode`: `"none"` or `"object"`
- `depthTest`, `renderOrder`

`dash` is progress-based. `size`, `gap`, and `phase` are normalized path progress units, not world
units.

### NeonCurve

Convenience wrapper around `VectorPath3D`. It renders a bright inner curve and a wider additive glow
layer.

### CalligraphyRibbon

Variable-width brush stroke. Built CPU-side so `customPressure(t)` can affect sampled width before
the geometry reaches the GPU.

### MotionTrail

Fading trail behind a moving object. Pass `targetRef` to sample an object's world position, or pass
`points` to render a fixed trail.

### FeatheredPlane

Rectangular panel with UV-based soft edges. Useful for 3D HUD panels and simple vector-like cards.

## Geometry API

The geometry builders are framework-independent:

```ts
import { buildRibbonGeometry, sampleCurve } from "@moritzbrantner/r3f-vector-effects";

const geometry = buildRibbonGeometry(points, {
  width: 0.12,
  segments: 64,
  widthProfile: "taper",
  dash: { enabled: true, size: 0.12, gap: 0.08 },
});
```

`buildRibbonGeometry` writes:

- `position`
- `normal`
- `uv`
- `pathProgress`
- `side`
- indexed triangles between neighboring samples

It handles short point arrays, duplicate points, closed paths, and very small segments.
Invalid coordinates are filtered before sampling, numeric options are normalized, and non-empty
geometries compute bounding boxes and bounding spheres.

## Material API

Material factories live under the root entrypoint and `./materials`:

```ts
import { createFeatheredRibbonMaterial } from "@moritzbrantner/r3f-vector-effects/materials";

const material = createFeatheredRibbonMaterial({
  colorStart: "#66ccff",
  colorEnd: "#f8ff7a",
  feather: 0.14,
  glow: 0.5,
  dash: { enabled: true, size: 0.1, gap: 0.05 },
});
```

Defaults are normalized: opacity is clamped to `0..1`, feather is clamped to `0..1`, glow is
non-negative, invalid dash values fall back to safe progress-based defaults, and depth testing is
enabled unless explicitly disabled.

## Demo

```bash
bun install
bun run example:dev
```

The demo lives in `examples/vite-r3f-demo` and includes controls for width, feather, glow, dashes,
and start/end colors.

## Benchmark

```bash
bun run benchmark
```

The benchmark lives in `examples/benchmark` and can switch between WebGL and WebGPU. It measures
FPS, average frame time, p95 frame time, draw calls, triangle count, and scene build time across a
configurable number of ribbon paths and segments.

Two material paths are available:

- `GLSL WebGL`: the package's current `ShaderMaterial` implementation for WebGL testing.
- `TSL WebGPU`: an experimental WebGPU-compatible node material imported from
  `@moritzbrantner/r3f-vector-effects/experimental/tsl`.

WebGPU requires browser support and a secure context; `localhost` from the Vite dev server is fine.
If WebGPU is selected in an unsupported browser, the benchmark reports that in the status panel.

The `./experimental/tsl` entrypoint is unstable and excluded from SemVer guarantees until it is
promoted to the stable material API.

## Performance Notes

- Pass stable `points` arrays when possible; React components rebuild geometry when the points array
  identity changes.
- Higher `segments` values increase CPU geometry build cost and vertex count.
- Dashes are progress-based rather than world-unit spacing.
- `billboardMode: "object"` rotates the whole mesh toward the camera; it is not per-segment
  screen-space billboarding.

## Limitations

- `billboardMode: "object"` rotates the whole mesh toward the camera. It is not per-segment
  screen-space billboarding.
- Dashes are progress-based, not exact world-unit dash lengths.
- Glow is an additive alpha falloff, not a postprocessing bloom pass.
- Ribbon frames are stable for common curves but are not a full production-grade parallel transport
  implementation for every pathological 3D path.
- Rounded `FeatheredPlane` corners are intentionally simple.

## Roadmap

- World-unit dash spacing.
- More robust frame transport for difficult closed 3D curves.
- Tube and hybrid ribbon/tube components.
- Instanced trail and particle-assisted glow variants.
- Promote the experimental TSL/WebGPU adapter once the WebGL API is stable.
