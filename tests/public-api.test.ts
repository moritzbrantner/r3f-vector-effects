import { describe, expect, it } from "vitest";
import * as geometryApi from "../src/geometry";
import * as publicApi from "../src/index";
import type {
  BuildRibbonGeometryOptions,
  BuildStableFramesOptions,
  BuildTubePathGeometryOptions,
  CalligraphyRibbonProps,
  DashStyle,
  FeatheredPlaneProps,
  FeatheredRibbonMaterialOptions,
  MotionTrailProps,
  NeonCurveProps,
  PathSamplingOptions,
  RibbonMaterialOptions,
  VectorPath3DProps,
} from "../src/index";
import * as materialsApi from "../src/materials";
import * as reactApi from "../src/react";

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
      "updateMaterialUniforms",
    ]);
  });

  it("keeps public prop and option types importable from the root", () => {
    const dash: DashStyle = { enabled: true, size: 0.2, gap: 0.1 };
    const sampling: PathSamplingOptions = { segments: 8, curveType: "catmull-rom", epsilon: 1e-5 };
    const vectorPathProps: VectorPath3DProps = {
      points: [
        [0, 0, 0],
        [1, 0, 0],
      ],
      dash,
      billboardMode: "object",
    };
    const neonProps: NeonCurveProps = { points: vectorPathProps.points };
    const calligraphyProps: CalligraphyRibbonProps = { points: vectorPathProps.points };
    const motionTrailProps: MotionTrailProps = { points: vectorPathProps.points };
    const featheredPlaneProps: FeatheredPlaneProps = { width: 1, height: 1 };
    const ribbonOptions: BuildRibbonGeometryOptions = {
      width: 0.1,
      customWidthProfile: (t) => t,
      billboard: true,
      up: [0, 0, 1],
      dash,
    };
    const frameOptions: BuildStableFramesOptions = { up: [0, 1, 0], billboard: false };
    const tubeOptions: BuildTubePathGeometryOptions = { radius: 0.05 };
    const materialOptions: RibbonMaterialOptions = { color: "white", dash };
    const featheredOptions: FeatheredRibbonMaterialOptions = {
      colorStart: "white",
      colorEnd: "black",
      dashed: true,
      dashSize: 0.2,
      gapSize: 0.1,
    };

    expect({
      sampling,
      vectorPathProps,
      neonProps,
      calligraphyProps,
      motionTrailProps,
      featheredPlaneProps,
      ribbonOptions,
      frameOptions,
      tubeOptions,
      materialOptions,
      featheredOptions,
    }).toBeDefined();
  });

  it("exports stable subpath entrypoint surfaces", () => {
    expect(Object.keys(reactApi).sort()).toEqual([
      "CalligraphyRibbon",
      "FeatheredPlane",
      "MotionTrail",
      "NeonCurve",
      "VectorPath3D",
    ]);
    expect(Object.keys(geometryApi).sort()).toEqual([
      "buildRibbonGeometry",
      "buildStableFrames",
      "buildTubePathGeometry",
      "compactPoints",
      "sampleCurve",
      "toVector3Array",
    ]);
    expect(Object.keys(materialsApi).sort()).toEqual([
      "createFeatheredRibbonMaterial",
      "createGradientLineMaterial",
      "createNeonMaterial",
      "updateMaterialUniforms",
    ]);
  });
});
