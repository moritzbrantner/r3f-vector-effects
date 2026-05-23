import type { ThreeElements } from "@react-three/fiber";
import type * as React from "react";
import type * as THREE from "three";

export type VectorEffectPoint = readonly [number, number, number] | THREE.Vector3;

export type CurveType = "catmull-rom" | "catmullrom" | "polyline";

export type WidthProfile = "constant" | "taper" | "calligraphy" | "pulse";

export type BillboardMode = "none" | "object";

type MeshElementProps = ThreeElements["mesh"];

interface CommonObject3DProps {
  /** Optional object name applied to the underlying three.js object. */
  name?: THREE.Object3D["name"];
  /** Whether the underlying object is rendered. */
  visible?: THREE.Object3D["visible"];
  /** User data attached to the underlying three.js object. */
  userData?: THREE.Object3D["userData"];
  /** Whether three.js may skip rendering when the object is outside the camera frustum. */
  frustumCulled?: THREE.Object3D["frustumCulled"];
  /** React Three Fiber-compatible local position. */
  position?: MeshElementProps["position"];
  /** React Three Fiber-compatible local rotation. */
  rotation?: MeshElementProps["rotation"];
  /** React Three Fiber-compatible local scale. */
  scale?: MeshElementProps["scale"];
}

interface MeshInteractionProps {
  /** Pointer-over handler forwarded to the underlying mesh. */
  onPointerOver?: MeshElementProps["onPointerOver"];
  /** Pointer-out handler forwarded to the underlying mesh. */
  onPointerOut?: MeshElementProps["onPointerOut"];
  /** Click handler forwarded to the underlying mesh. */
  onClick?: MeshElementProps["onClick"];
}

export interface PathSamplingOptions {
  /** Close the path by connecting the final sampled point back to the first. */
  closed?: boolean;
  /** Number of samples along the path. Open paths emit segments + 1 sample bands. */
  segments?: number;
  /** Curve interpolation. "catmullrom" is kept as a backwards-compatible alias. */
  curveType?: CurveType;
  /** Distance threshold used when removing duplicate or nearly duplicate points. */
  epsilon?: number;
}

export interface DashStyle {
  enabled?: boolean;
  size?: number;
  gap?: number;
  phase?: number;
  units?: "progress" | "world";
}

export interface RibbonStyle {
  /** Full ribbon width in local units before profile scaling. */
  width?: number;
  /** Built-in width multiplier sampled from path progress. */
  widthProfile?: WidthProfile;
  /** Custom width multiplier. Prefer customWidthProfile for new code. */
  widthCallback?: (t: number) => number;
  /** Custom width multiplier sampled from normalized path progress. */
  customWidthProfile?: (t: number) => number;
  feather?: number;
  glow?: number;
  opacity?: number;
  color?: THREE.ColorRepresentation;
  colorStart?: THREE.ColorRepresentation;
  colorEnd?: THREE.ColorRepresentation;
  dash?: DashStyle;
  depthTest?: boolean;
  blending?: THREE.Blending;
}

export interface FeatheredRibbonMaterialOptions {
  color?: THREE.ColorRepresentation;
  colorStart?: THREE.ColorRepresentation;
  colorEnd?: THREE.ColorRepresentation;
  opacity?: number;
  feather?: number;
  glow?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
  dashPhase?: number;
  alphaTest?: number;
  depthTest?: boolean;
  depthWrite?: boolean;
  transparent?: boolean;
  blending?: THREE.Blending;
  /** Backwards-compatible grouped dash style used by VectorPath3D. */
  dash?: DashStyle;
  /** Fade alpha from the start of the path. */
  fade?: number;
  animated?: boolean;
  pulseSpeed?: number;
}

export interface VectorPath3DProps
  extends PathSamplingOptions,
    RibbonStyle,
    CommonObject3DProps,
    MeshInteractionProps {
  /** Path points as `[x, y, z]` tuples or `THREE.Vector3` values. */
  points: readonly VectorEffectPoint[];
  /** Rotate the whole ribbon object toward the camera each frame. */
  billboardMode?: BillboardMode;
  /** Mesh render order. Useful for overlay-style ribbons. */
  renderOrder?: number;
  /** Whether the material writes depth. Defaults to `false`. */
  depthWrite?: boolean;
}

export interface NeonCurveProps extends CommonObject3DProps {
  /** Path points as `[x, y, z]` tuples or `THREE.Vector3` values. */
  points: readonly VectorEffectPoint[];
  /** Backwards-compatible color used for both core and glow when specific colors are omitted. */
  color?: THREE.ColorRepresentation;
  /** Core ribbon color. Defaults to `color`. */
  coreColor?: THREE.ColorRepresentation;
  /** Glow ribbon color. Defaults to `color`. */
  glowColor?: THREE.ColorRepresentation;
  closed?: boolean;
  segments?: number;
  curveType?: CurveType;
  coreWidth?: number;
  glowWidth?: number;
  intensity?: number;
  /** Core layer opacity. Defaults to an intensity-derived value. */
  opacity?: number;
  /** Glow layer opacity. Defaults to an intensity-derived value. */
  glowOpacity?: number;
  /** Enable dashed rendering for both layers. */
  dashed?: boolean;
  /** Dash length in normalized progress or world units. */
  dashSize?: number;
  /** Gap length in normalized progress or world units. */
  gapSize?: number;
  /** Dash phase offset. */
  dashPhase?: number;
  /** Dash length units. */
  dashUnits?: "progress" | "world";
  /** Whether both layers participate in depth testing. Defaults to `false`. */
  depthTest?: boolean;
  /** Base render order. The core layer renders one step above this value. */
  renderOrder?: number;
  pulseSpeed?: number;
  animated?: boolean;
}

export type PressureProfile = "start-end-taper" | "middle-heavy" | "sinusoidal" | "custom";

export interface CalligraphyRibbonProps
  extends PathSamplingOptions,
    Pick<
      RibbonStyle,
      "feather" | "glow" | "opacity" | "colorStart" | "colorEnd" | "dash" | "depthTest"
    >,
    CommonObject3DProps,
    MeshInteractionProps {
  /** Path points as `[x, y, z]` tuples or `THREE.Vector3` values. */
  points: readonly VectorEffectPoint[];
  /** Backwards-compatible solid stroke color. */
  color?: THREE.ColorRepresentation;
  /** Full ribbon width in local units before pressure scaling. */
  width?: number;
  /** Built-in pressure profile used to scale width along the path. */
  pressureProfile?: PressureProfile;
  /** Custom pressure multiplier used when `pressureProfile` is `"custom"`. */
  customPressure?: (t: number) => number;
  /** Rotate the whole ribbon object toward the camera each frame. */
  billboardMode?: BillboardMode;
  /** Mesh render order. */
  renderOrder?: number;
}

export interface MotionTrailProps extends CommonObject3DProps, MeshInteractionProps {
  /** Object whose world position is sampled over time. */
  targetRef?: React.RefObject<THREE.Object3D>;
  /** Fixed trail points. When provided, live target sampling is disabled. */
  points?: readonly VectorEffectPoint[];
  /** Maximum retained live trail samples. */
  maxPoints?: number;
  /** Full trail width in local units. */
  width?: number;
  /** Backwards-compatible solid trail color. */
  color?: THREE.ColorRepresentation;
  /** Start color for the trail gradient. */
  colorStart?: THREE.ColorRepresentation;
  /** End color for the trail gradient. */
  colorEnd?: THREE.ColorRepresentation;
  /** Trail opacity. */
  opacity?: number;
  /** Trail edge softness. */
  feather?: number;
  /** Additive glow strength. */
  glow?: number;
  /** Trail fade amount along its length. */
  decay?: number;
  /** Minimum seconds between live samples. */
  updateEvery?: number;
  /** Minimum world-space distance before appending a new live sample. */
  minDistance?: number;
  /** Pause live target sampling while preserving the current trail. */
  paused?: boolean;
  /** Whether the trail participates in depth testing. Defaults to `false`. */
  depthTest?: boolean;
  /** Mesh render order. */
  renderOrder?: number;
}

export interface FeatheredPlaneProps extends CommonObject3DProps, MeshInteractionProps {
  /** Plane width in local units. */
  width: number;
  /** Plane height in local units. */
  height: number;
  /** Panel fill color. */
  color?: THREE.ColorRepresentation;
  /** Panel opacity. */
  opacity?: number;
  /** UV edge softness. */
  feather?: number;
  /** Simple rounded-corner mask radius. */
  radius?: number;
  /** Whether the panel participates in depth testing. */
  depthTest?: boolean;
  /** Whether the material writes depth. Defaults to `false`. */
  depthWrite?: boolean;
  /** Mesh render order. */
  renderOrder?: number;
  /** Material side used by the panel mesh. */
  side?: THREE.Side;
}

export interface TubePath3DProps
  extends PathSamplingOptions,
    CommonObject3DProps,
    MeshInteractionProps {
  /** Path points as `[x, y, z]` tuples or `THREE.Vector3` values. */
  points: readonly VectorEffectPoint[];
  /** Tube radius in local units. */
  radius?: number;
  /** Number of radial segments around the tube. */
  radialSegments?: number;
  /** Default material color when no caller-owned material is provided. */
  color?: THREE.ColorRepresentation;
  /** Default material opacity when no caller-owned material is provided. */
  opacity?: number;
  /** Default material depth testing when no caller-owned material is provided. */
  depthTest?: boolean;
  /** Mesh render order. */
  renderOrder?: number;
  /** Caller-owned material. It is not disposed by the component. */
  material?: THREE.Material;
}
