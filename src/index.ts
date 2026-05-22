export { CalligraphyRibbon, FeatheredPlane, MotionTrail, NeonCurve, VectorPath3D } from "./react";

export {
  buildRibbonGeometry,
  buildStableFrames,
  buildTubePathGeometry,
  compactPoints,
  sampleCurve,
  toVector3Array,
} from "./geometry";

export {
  createFeatheredRibbonMaterial,
  createGradientLineMaterial,
  createNeonMaterial,
} from "./materials";

export type {
  BillboardMode,
  CalligraphyRibbonProps,
  CurveType,
  DashStyle,
  FeatheredPlaneProps,
  MotionTrailProps,
  NeonCurveProps,
  PathSamplingOptions,
  PressureProfile,
  RibbonStyle,
  VectorEffectPoint,
  VectorPath3DProps,
  WidthProfile,
} from "./types";
export type { BuildRibbonGeometryOptions, BuildTubePathGeometryOptions } from "./geometry";
export type { FeatheredRibbonMaterialOptions, RibbonMaterialOptions } from "./materials";
