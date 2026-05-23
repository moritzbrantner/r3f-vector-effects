export {
  CalligraphyRibbon,
  FeatheredPlane,
  MotionTrail,
  NeonCurve,
  TubePath3D,
  VectorPath3D,
} from "./react";

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
  updateMaterialUniforms,
} from "./materials";

export type {
  BillboardMode,
  CalligraphyRibbonProps,
  CurveType,
  DashStyle,
  FeatheredRibbonMaterialOptions,
  FeatheredPlaneProps,
  MotionTrailProps,
  NeonCurveProps,
  PathSamplingOptions,
  PressureProfile,
  RibbonStyle,
  TubePath3DProps,
  VectorEffectPoint,
  VectorPath3DProps,
  WidthProfile,
} from "./types";
export type {
  BuildRibbonGeometryOptions,
  BuildStableFramesOptions,
  BuildTubePathGeometryOptions,
  RibbonFrame,
} from "./geometry";
export type { RibbonMaterialOptions } from "./materials";
