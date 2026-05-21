import * as THREE from "three";
import type { CurveType, VectorEffectPoint } from "../types";
import { compactPoints } from "./sampleCurve";

export interface BuildTubePathGeometryOptions {
  closed?: boolean;
  segments?: number;
  radius?: number;
  radialSegments?: number;
  curveType?: CurveType;
}

export function buildTubePathGeometry(
  points: VectorEffectPoint[],
  options: BuildTubePathGeometryOptions = {},
): THREE.BufferGeometry {
  const clean = compactPoints(points, options.closed ?? false);

  if (clean.length < 2) {
    return new THREE.BufferGeometry();
  }

  const curve =
    (options.curveType ?? "catmullrom") === "polyline" || clean.length < 3
      ? new THREE.CatmullRomCurve3(clean, options.closed ?? false, "chordal", 0)
      : new THREE.CatmullRomCurve3(clean, options.closed ?? false, "centripetal");

  return new THREE.TubeGeometry(
    curve,
    Math.max(1, Math.floor(options.segments ?? 64)),
    options.radius ?? 0.04,
    Math.max(3, Math.floor(options.radialSegments ?? 8)),
    options.closed ?? false,
  );
}
