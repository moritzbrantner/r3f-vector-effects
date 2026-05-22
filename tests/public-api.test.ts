import { describe, expect, it } from "vitest";
import * as publicApi from "../src/index";
import type {
  BuildRibbonGeometryOptions,
  BuildTubePathGeometryOptions,
  CalligraphyRibbonProps,
  FeatheredPlaneProps,
  FeatheredRibbonMaterialOptions,
  MotionTrailProps,
  NeonCurveProps,
  VectorPath3DProps,
} from "../src/index";

describe("public API", () => {
  it("exports the stable root entrypoint surface", () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      "CalligraphyRibbon",
      "FeatheredPlane",
      "MotionTrail",
      "NeonCurve",
      "VectorPath3D",
      "buildRibbonGeometry",
      "buildStableFrames",
      "buildTubePathGeometry",
      "compactPoints",
      "createFeatheredRibbonMaterial",
      "createGradientLineMaterial",
      "createNeonMaterial",
      "sampleCurve",
      "toVector3Array",
    ]);
  });

  it("keeps public prop and option types importable from the root", () => {
    const vectorPathProps: VectorPath3DProps = {
      points: [
        [0, 0, 0],
        [1, 0, 0],
      ],
    };
    const neonProps: NeonCurveProps = { points: vectorPathProps.points };
    const calligraphyProps: CalligraphyRibbonProps = { points: vectorPathProps.points };
    const motionTrailProps: MotionTrailProps = { points: vectorPathProps.points };
    const featheredPlaneProps: FeatheredPlaneProps = { width: 1, height: 1 };
    const ribbonOptions: BuildRibbonGeometryOptions = { width: 0.1 };
    const tubeOptions: BuildTubePathGeometryOptions = { radius: 0.05 };
    const materialOptions: FeatheredRibbonMaterialOptions = { color: "white" };

    expect({
      vectorPathProps,
      neonProps,
      calligraphyProps,
      motionTrailProps,
      featheredPlaneProps,
      ribbonOptions,
      tubeOptions,
      materialOptions,
    }).toBeDefined();
  });
});
