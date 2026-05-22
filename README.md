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
- `dashed`, `dashSize`, `gapSize`
- `billboard`, `depthTest`, `renderOrder`

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
- `TSL WebGPU`: a WebGPU-compatible node material that mirrors the feathered gradient ribbon effect
  for WebGPU testing.

WebGPU requires browser support and a secure context; `localhost` from the Vite dev server is fine.
If WebGPU is selected in an unsupported browser, the benchmark reports that in the status panel.

## Limitations

- Billboard support rotates the whole mesh toward the camera. It is not per-segment screen-space
  billboarding.
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
- Optional isolated TSL/WebGPU adapter once the WebGL MVP is stable.
