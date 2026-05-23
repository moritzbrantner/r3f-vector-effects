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
import { CalligraphyRibbon, NeonCurve, TubePath3D } from "@moritzbrantner/r3f-vector-effects";

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
      <TubePath3D
        points={[
          [-2, -1.4, 0],
          [0, -1.8, 0.4],
          [2, -1.4, 0],
        ]}
        radius={0.035}
        color="#8cff9a"
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

Stable entrypoints are the root package, `./react`, `./geometry`, and `./materials`. The
`./experimental/tsl` entrypoint is intentionally unstable and excluded from SemVer guarantees until
it is promoted to the stable material API.

## Components

### VectorPath3D

General-purpose 3D path renderer. It samples points as a Catmull-Rom curve by default, builds a
ribbon mesh, and adds UVs where `u` is path progress and `v` is the cross-path coordinate.

| Prop | Purpose |
| --- | --- |
| `points` | Path points as `[x, y, z]` tuples or `THREE.Vector3` values. |
| `closed`, `segments`, `curveType` | Sampling controls. `curveType` accepts `"catmull-rom"`, `"catmullrom"`, or `"polyline"`. |
| `width`, `widthProfile` | Base width and built-in width profile: `"constant"`, `"taper"`, `"calligraphy"`, or `"pulse"`. |
| `customWidthProfile`, `widthCallback` | Custom width multipliers sampled from normalized progress. `customWidthProfile` wins if both are provided. |
| `color`, `colorStart`, `colorEnd` | Solid color or path-progress gradient. |
| `opacity`, `feather`, `glow` | Alpha, soft-edge, and glow-style shader controls. |
| `dash` | `{ enabled, size, gap, phase, units }`; `units` is `"progress"` or `"world"`. |
| `billboardMode` | `"none"` or `"object"` object-level billboarding. |
| `depthTest`, `renderOrder` | Rendering order controls for overlay-style effects. |

Progress dashes use normalized path progress, so `size: 0.1` means 10% of the sampled path. World
dashes use local path distance, so `size: 0.2` means 0.2 scene units along the path.

```tsx
<VectorPath3D
  points={[
    [-1, 0, 0],
    [0, 0.6, 0.2],
    [1, 0, 0],
  ]}
  width={0.12}
  colorStart="#66ccff"
  colorEnd="#f8ff7a"
  dash={{ enabled: true, units: "world", size: 0.2, gap: 0.1 }}
/>
```

```tsx
<VectorPath3D
  points={points}
  width={0.18}
  customWidthProfile={(t) => 0.25 + Math.sin(Math.PI * t)}
/>
```

### NeonCurve

Convenience wrapper around `VectorPath3D`. It renders a bright inner curve and a wider additive glow
layer.

| Prop | Purpose |
| --- | --- |
| `points`, `closed`, `segments`, `curveType` | Path sampling controls. |
| `color` | Core and glow color. |
| `coreWidth`, `glowWidth` | Inner and outer ribbon widths. |
| `intensity` | Glow strength and opacity scaling. |
| `animated`, `pulseSpeed` | Optional shader pulse animation. |

```tsx
<NeonCurve points={points} color="#48f4d6" coreWidth={0.035} glowWidth={0.28} animated />
```

### CalligraphyRibbon

Variable-width brush stroke. Built CPU-side so `customPressure(t)` can affect sampled width before
the geometry reaches the GPU.

| Prop | Purpose |
| --- | --- |
| `points`, `closed`, `segments`, `curveType` | Path sampling controls. |
| `color`, `width` | Stroke color and base width. |
| `pressureProfile` | `"start-end-taper"`, `"middle-heavy"`, `"sinusoidal"`, or `"custom"`. |
| `customPressure` | Width multiplier used when `pressureProfile` is `"custom"`. |

```tsx
<CalligraphyRibbon points={points} color="#fff3c4" width={0.22} pressureProfile="middle-heavy" />
```

### MotionTrail

Fading trail behind a moving object. Pass `targetRef` to sample an object's world position, or pass
`points` to render a fixed trail.

| Prop | Purpose |
| --- | --- |
| `targetRef` | Object whose world position is sampled over time. |
| `points` | Fixed trail points; disables live target sampling. |
| `maxPoints` | Maximum retained trail samples. |
| `width`, `color`, `decay` | Trail shape and fade controls. |
| `updateEvery` | Minimum seconds between live samples. |

```tsx
<MotionTrail targetRef={meshRef} color="#ff5c8a" width={0.1} maxPoints={96} decay={1.6} />
```

### FeatheredPlane

Rectangular panel with UV-based soft edges. Useful for 3D HUD panels and simple vector-like cards.

| Prop | Purpose |
| --- | --- |
| `width`, `height` | Plane dimensions. |
| `color`, `opacity` | Panel fill. |
| `feather` | UV edge softness. |
| `radius` | Simple rounded-corner mask radius. |
| `depthTest` | Whether the panel participates in depth testing. |

```tsx
<FeatheredPlane width={4} height={1.6} color="#101826" opacity={0.7} feather={0.12} />
```

### TubePath3D

Tube path renderer backed by the framework-independent `buildTubePathGeometry` helper.

| Prop | Purpose |
| --- | --- |
| `points`, `closed`, `segments`, `curveType`, `epsilon` | Path sampling controls. |
| `radius`, `radialSegments` | Tube shape controls. |
| `color`, `opacity`, `depthTest` | Used by the default `MeshBasicMaterial`. |
| `material` | Optional caller-owned material. It is not disposed by the component. |
| `renderOrder` | Rendering order control. |

```tsx
<TubePath3D points={points} radius={0.04} radialSegments={10} color="#8cff9a" />
```

```tsx
const material = React.useMemo(() => new THREE.MeshStandardMaterial({ color: "white" }), []);

<TubePath3D points={points} radius={0.05} material={material} />;
```

## Geometry API

The geometry builders are framework-independent:

```ts
import { buildRibbonGeometry, sampleCurve } from "@moritzbrantner/r3f-vector-effects";

const geometry = buildRibbonGeometry(points, {
  width: 0.12,
  segments: 64,
  widthProfile: "taper",
  dash: { enabled: true, units: "world", size: 0.2, gap: 0.1 },
});
```

`buildRibbonGeometry` writes:

- `position`
- `normal`
- `uv`
- `pathProgress`
- `pathDistance`
- `side`
- `width`
- indexed triangles between neighboring samples

It handles short point arrays, duplicate points, closed paths, and very small segments.
Invalid coordinates are filtered before sampling, numeric options are normalized, and non-empty
geometries compute bounding boxes and bounding spheres.

| Helper | Purpose |
| --- | --- |
| `sampleCurve(points, options)` | Samples Catmull-Rom or polyline paths and returns points, tangents, progress, distances, and total length. |
| `compactPoints(points, closed, epsilon)` | Converts inputs to vectors, removes invalid values, and drops near-duplicates. |
| `buildStableFrames(tangents, options)` | Builds ribbon frames from sampled tangents. |
| `buildRibbonGeometry(points, options)` | Builds two-vertex-per-sample ribbon geometry with progress and distance attributes. |
| `buildTubePathGeometry(points, options)` | Builds a three.js `TubeGeometry` from the same path options. |

## Material API

Material factories live under the root entrypoint and `./materials`:

```ts
import { createFeatheredRibbonMaterial } from "@moritzbrantner/r3f-vector-effects/materials";

const material = createFeatheredRibbonMaterial({
  colorStart: "#66ccff",
  colorEnd: "#f8ff7a",
  feather: 0.14,
  glow: 0.5,
  dash: { enabled: true, units: "progress", size: 0.1, gap: 0.05 },
});
```

Defaults are normalized: opacity is clamped to `0..1`, feather is clamped to `0..1`, glow is
non-negative, invalid dash values fall back to safe progress-based defaults, and depth testing is
enabled unless explicitly disabled.

| Factory | Purpose |
| --- | --- |
| `createFeatheredRibbonMaterial(options)` | Soft-edged gradient/dashed ribbon `ShaderMaterial`. |
| `updateMaterialUniforms(material, options)` | Updates an existing ribbon material without replacing it. |
| `createGradientLineMaterial(options)` | Hard-edged gradient line material preset. |
| `createNeonMaterial(options)` | Additive glow material preset. |

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
- Progress dashes are cheaper to reason about on normalized paths; world-unit dashes need valid
  `pathDistance` attributes from the package geometry builders.
- `billboardMode: "object"` rotates the whole mesh toward the camera; it is not per-segment
  screen-space billboarding.

## Limitations

- `billboardMode: "object"` rotates the whole mesh toward the camera. It is not per-segment
  screen-space billboarding.
- World-unit dashes are based on sampled curve distance, so very low segment counts can make spacing
  less precise on high-curvature paths.
- Glow is an additive alpha falloff, not a postprocessing bloom pass.
- Ribbon frames are stable for common curves but are not a full production-grade parallel transport
  implementation for every pathological 3D path.
- Rounded `FeatheredPlane` corners are intentionally simple.

## Roadmap

- More robust frame transport for difficult closed 3D curves.
- Hybrid ribbon/tube components.
- Instanced trail and particle-assisted glow variants.
- Promote the experimental TSL/WebGPU adapter once the WebGL API is stable.
