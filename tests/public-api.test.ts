import * as React from "react";
import * as THREE from "three";
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
  TubePath3DProps,
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
      "TubePath3D",
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
    const dash: DashStyle = { enabled: true, units: "world", size: 0.2, gap: 0.1 };
    const sampling: PathSamplingOptions = { segments: 8, curveType: "catmull-rom", epsilon: 1e-5 };
    const vectorPathProps: VectorPath3DProps = {
      points: [
        [0, 0, 0],
        [1, 0, 0],
      ],
      dash,
      billboardMode: "object",
      depthWrite: false,
      frustumCulled: false,
      visible: true,
      name: "path",
      userData: { id: "path" },
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      onClick: () => undefined,
    };
    const neonProps: NeonCurveProps = {
      points: vectorPathProps.points,
      coreColor: "white",
      glowColor: "cyan",
      opacity: 0.9,
      glowOpacity: 0.4,
      dashed: true,
      dashSize: 0.2,
      gapSize: 0.1,
      dashPhase: 0.05,
      dashUnits: "world",
      depthTest: false,
      renderOrder: 2,
      visible: true,
      name: "neon",
      userData: { id: "neon" },
      frustumCulled: false,
      position: [0, 0, 0],
    };
    const calligraphyProps: CalligraphyRibbonProps = {
      points: vectorPathProps.points,
      colorStart: "white",
      colorEnd: "black",
      opacity: 0.8,
      feather: 0.2,
      glow: 0.3,
      dash,
      depthTest: false,
      renderOrder: 3,
      billboardMode: "none",
      name: "calligraphy",
      frustumCulled: false,
    };
    const motionTrailProps: MotionTrailProps = {
      points: vectorPathProps.points,
      minDistance: 0.01,
      paused: true,
      colorStart: "white",
      colorEnd: "hotpink",
      opacity: 0.7,
      feather: 0.25,
      glow: 0.5,
      depthTest: false,
      renderOrder: 4,
      name: "trail",
      frustumCulled: false,
    };
    const featheredPlaneProps: FeatheredPlaneProps = {
      width: 1,
      height: 1,
      depthWrite: false,
      renderOrder: 5,
      side: THREE.DoubleSide,
      visible: true,
      name: "plane",
      frustumCulled: false,
    };
    const tubePathProps: TubePath3DProps = {
      points: vectorPathProps.points,
      radius: 0.05,
      frustumCulled: false,
      visible: true,
      name: "tube",
      userData: { id: "tube" },
    };
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
      tubePathProps,
      ribbonOptions,
      frameOptions,
      tubeOptions,
      materialOptions,
      featheredOptions,
    }).toBeDefined();
  });

  it("accepts forwarded ref types on public React components", () => {
    expect(
      React.createElement(publicApi.VectorPath3D, {
        ref: React.createRef<THREE.Mesh>(),
        points: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      }),
    ).toBeDefined();
    expect(
      React.createElement(publicApi.NeonCurve, {
        ref: React.createRef<THREE.Group>(),
        points: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      }),
    ).toBeDefined();
    expect(
      React.createElement(publicApi.CalligraphyRibbon, {
        ref: React.createRef<THREE.Mesh>(),
        points: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      }),
    ).toBeDefined();
    expect(
      React.createElement(publicApi.MotionTrail, {
        ref: React.createRef<THREE.Mesh>(),
        points: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      }),
    ).toBeDefined();
    expect(
      React.createElement(publicApi.FeatheredPlane, {
        ref: React.createRef<THREE.Mesh>(),
        width: 1,
        height: 1,
      }),
    ).toBeDefined();
    expect(
      React.createElement(publicApi.TubePath3D, {
        ref: React.createRef<THREE.Mesh>(),
        points: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      }),
    ).toBeDefined();
  });

  it("exports stable subpath entrypoint surfaces", () => {
    expect(Object.keys(reactApi).sort()).toEqual([
      "CalligraphyRibbon",
      "FeatheredPlane",
      "MotionTrail",
      "NeonCurve",
      "TubePath3D",
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
