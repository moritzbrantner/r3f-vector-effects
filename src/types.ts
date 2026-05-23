import type * as React from "react";
import type * as THREE from "three";

export type VectorEffectPoint = readonly [number, number, number] | THREE.Vector3;

export type CurveType = "catmull-rom" | "catmullrom" | "polyline";

export type WidthProfile = "constant" | "taper" | "calligraphy" | "pulse";

export type BillboardMode = "none" | "object";

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

export interface VectorPath3DProps extends PathSamplingOptions, RibbonStyle {
  points: readonly VectorEffectPoint[];
  billboardMode?: BillboardMode;
  renderOrder?: number;
}

export interface NeonCurveProps {
  points: readonly VectorEffectPoint[];
  color?: THREE.ColorRepresentation;
  closed?: boolean;
  segments?: number;
  curveType?: CurveType;
  coreWidth?: number;
  glowWidth?: number;
  intensity?: number;
  pulseSpeed?: number;
  animated?: boolean;
}

export type PressureProfile = "start-end-taper" | "middle-heavy" | "sinusoidal" | "custom";

export interface CalligraphyRibbonProps {
  points: readonly VectorEffectPoint[];
  color?: THREE.ColorRepresentation;
  closed?: boolean;
  segments?: number;
  curveType?: CurveType;
  width?: number;
  pressureProfile?: PressureProfile;
  customPressure?: (t: number) => number;
}

export interface MotionTrailProps {
  targetRef?: React.RefObject<THREE.Object3D>;
  points?: readonly VectorEffectPoint[];
  maxPoints?: number;
  width?: number;
  color?: THREE.ColorRepresentation;
  decay?: number;
  updateEvery?: number;
}

export interface FeatheredPlaneProps {
  width: number;
  height: number;
  color?: THREE.ColorRepresentation;
  opacity?: number;
  feather?: number;
  radius?: number;
  depthTest?: boolean;
}

export interface TubePath3DProps extends PathSamplingOptions {
  points: readonly VectorEffectPoint[];
  radius?: number;
  radialSegments?: number;
  color?: THREE.ColorRepresentation;
  opacity?: number;
  depthTest?: boolean;
  renderOrder?: number;
  material?: THREE.Material;
}
