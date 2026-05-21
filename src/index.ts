export { VectorPath3D } from "./components/VectorPath3D";
export { NeonCurve } from "./components/NeonCurve";
export { CalligraphyRibbon } from "./components/CalligraphyRibbon";
export { MotionTrail } from "./components/MotionTrail";
export { FeatheredPlane } from "./components/FeatheredPlane";

export { buildRibbonGeometry } from "./geometry/buildRibbonGeometry";
export { buildTubePathGeometry } from "./geometry/buildTubePathGeometry";
export { buildStableFrames } from "./geometry/frames";
export { sampleCurve, compactPoints, toVector3Array } from "./geometry/sampleCurve";

export { createGradientLineMaterial } from "./materials/createGradientLineMaterial";
export { createFeatheredRibbonMaterial } from "./materials/createFeatheredRibbonMaterial";
export { createNeonMaterial } from "./materials/createNeonMaterial";

export type {
  CalligraphyRibbonProps,
  CurveType,
  FeatheredPlaneProps,
  MotionTrailProps,
  NeonCurveProps,
  PressureProfile,
  VectorEffectPoint,
  VectorPath3DProps,
  WidthProfile,
} from "./types";
export type { BuildRibbonGeometryOptions } from "./geometry/buildRibbonGeometry";
export type { BuildTubePathGeometryOptions } from "./geometry/buildTubePathGeometry";
export type { FeatheredRibbonMaterialOptions } from "./materials/createFeatheredRibbonMaterial";
