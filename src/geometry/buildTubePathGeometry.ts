import * as THREE from "three";
import { normalizeSamplingOptions } from "../core/normalize";
import type { PathSamplingOptions, VectorEffectPoint } from "../types";
import { safePositive } from "../utils/math";
import { compactPoints } from "./sampleCurve";

export interface BuildTubePathGeometryOptions extends PathSamplingOptions {
  radius?: number;
  radialSegments?: number;
}

export function buildTubePathGeometry(
  points: readonly VectorEffectPoint[],
  options: BuildTubePathGeometryOptions = {},
): THREE.BufferGeometry {
  const sampling = normalizeSamplingOptions(options);
  const clean = compactPoints(points, sampling.closed);

  if (clean.length < 2) {
    return new THREE.BufferGeometry();
  }

  const curve =
    sampling.curveType === "polyline" || clean.length < 3
      ? new THREE.CatmullRomCurve3(clean, sampling.closed, "chordal", 0)
      : new THREE.CatmullRomCurve3(clean, sampling.closed, "centripetal");

  return new THREE.TubeGeometry(
    curve,
    sampling.segments,
    safePositive(options.radius, 0.04),
    Math.max(3, Math.floor(options.radialSegments ?? 8)),
    sampling.closed,
  );
}
