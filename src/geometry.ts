export { buildRibbonGeometry } from "./geometry/buildRibbonGeometry";
export { buildTubePathGeometry } from "./geometry/buildTubePathGeometry";
export { buildStableFrames } from "./geometry/frames";
export { sampleCurve, compactPoints, toVector3Array } from "./geometry/sampleCurve";

export type { BuildRibbonGeometryOptions } from "./geometry/buildRibbonGeometry";
export type { BuildTubePathGeometryOptions } from "./geometry/buildTubePathGeometry";
export type { BuildStableFramesOptions, RibbonFrame } from "./geometry/frames";
export type {
  CurveType,
  PathSamplingOptions,
  VectorEffectPoint,
  WidthProfile,
} from "./types";
