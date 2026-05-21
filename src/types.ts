import type * as React from "react";
import type * as THREE from "three";

export type VectorEffectPoint = [number, number, number] | THREE.Vector3;

export type CurveType = "catmullrom" | "polyline";

export type WidthProfile = "constant" | "taper" | "calligraphy" | "pulse";

export interface VectorPath3DProps {
  points: VectorEffectPoint[];
  closed?: boolean;
  segments?: number;
  curveType?: CurveType;
  width?: number;
  widthProfile?: WidthProfile;
  color?: THREE.ColorRepresentation;
  colorStart?: THREE.ColorRepresentation;
  colorEnd?: THREE.ColorRepresentation;
  opacity?: number;
  feather?: number;
  glow?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
  billboard?: boolean;
  depthTest?: boolean;
  renderOrder?: number;
}

export interface NeonCurveProps {
  points: VectorEffectPoint[];
  color?: THREE.ColorRepresentation;
  coreWidth?: number;
  glowWidth?: number;
  intensity?: number;
  pulseSpeed?: number;
  animated?: boolean;
}

export type PressureProfile = "start-end-taper" | "middle-heavy" | "sinusoidal" | "custom";

export interface CalligraphyRibbonProps {
  points: VectorEffectPoint[];
  color?: THREE.ColorRepresentation;
  width?: number;
  pressureProfile?: PressureProfile;
  customPressure?: (t: number) => number;
}

export interface MotionTrailProps {
  targetRef?: React.RefObject<THREE.Object3D>;
  points?: VectorEffectPoint[];
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
