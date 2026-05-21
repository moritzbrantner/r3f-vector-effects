import * as THREE from "three";
import type { CurveType, VectorEffectPoint } from "../types";
import { EPSILON, clamp } from "../utils/math";

export interface SampleCurveOptions {
  closed?: boolean;
  segments?: number;
  curveType?: CurveType;
}

export interface SampledPath {
  points: THREE.Vector3[];
  tangents: THREE.Vector3[];
  progress: number[];
  distances: number[];
  totalLength: number;
  closed: boolean;
}

export function toVector3Array(points: VectorEffectPoint[]): THREE.Vector3[] {
  return points.map((point) =>
    Array.isArray(point) ? new THREE.Vector3(point[0], point[1], point[2]) : point.clone(),
  );
}

export function compactPoints(points: VectorEffectPoint[], closed = false): THREE.Vector3[] {
  const vectors = toVector3Array(points).filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z),
  );
  const compacted: THREE.Vector3[] = [];

  for (const point of vectors) {
    const previous = compacted.length > 0 ? compacted[compacted.length - 1] : undefined;
    if (!previous || previous.distanceToSquared(point) > EPSILON * EPSILON) {
      compacted.push(point);
    }
  }

  if (
    closed &&
    compacted.length > 1 &&
    compacted[0].distanceToSquared(compacted[compacted.length - 1]) <= EPSILON * EPSILON
  ) {
    compacted.pop();
  }

  return compacted;
}

export function sampleCurve(
  points: VectorEffectPoint[],
  options: SampleCurveOptions = {},
): SampledPath {
  const closed = options.closed ?? false;
  const curveType = options.curveType ?? "catmullrom";
  const clean = compactPoints(points, closed);
  const requestedSegments = Math.max(1, Math.floor(options.segments ?? 64));

  if (clean.length < 2) {
    return emptySampledPath(closed);
  }

  if (curveType === "polyline" || clean.length < 3) {
    return samplePolyline(clean, requestedSegments, closed);
  }

  return sampleCatmullRom(clean, requestedSegments, closed);
}

function emptySampledPath(closed: boolean): SampledPath {
  return {
    points: [],
    tangents: [],
    progress: [],
    distances: [],
    totalLength: 0,
    closed,
  };
}

function sampleCatmullRom(points: THREE.Vector3[], segments: number, closed: boolean): SampledPath {
  const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
  const count = closed ? segments : segments + 1;
  const sampledPoints: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];

  for (let i = 0; i < count; i += 1) {
    const t = closed ? i / count : i / (count - 1);
    sampledPoints.push(curve.getPoint(clamp(t, 0, 1)));
    const tangent = curve.getTangent(clamp(t, 0, 1));
    tangents.push(tangent.lengthSq() > EPSILON ? tangent.normalize() : new THREE.Vector3(1, 0, 0));
  }

  return withDistances(sampledPoints, tangents, closed);
}

function samplePolyline(points: THREE.Vector3[], segments: number, closed: boolean): SampledPath {
  const segmentLengths: number[] = [];
  let totalLength = 0;
  const edgeCount = closed ? points.length : points.length - 1;

  for (let i = 0; i < edgeCount; i += 1) {
    const next = (i + 1) % points.length;
    const length = points[i].distanceTo(points[next]);
    segmentLengths.push(length);
    totalLength += length;
  }

  if (totalLength <= EPSILON) {
    return emptySampledPath(closed);
  }

  const count = closed ? segments : segments + 1;
  const sampledPoints: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];

  for (let i = 0; i < count; i += 1) {
    const progress = closed ? i / count : i / (count - 1);
    const targetDistance = progress * totalLength;
    let cursor = 0;
    let edgeIndex = 0;

    while (
      edgeIndex < segmentLengths.length - 1 &&
      cursor + segmentLengths[edgeIndex] < targetDistance
    ) {
      cursor += segmentLengths[edgeIndex];
      edgeIndex += 1;
    }

    const next = (edgeIndex + 1) % points.length;
    const edgeLength = segmentLengths[edgeIndex] || 1;
    const edgeT = clamp((targetDistance - cursor) / edgeLength);
    const point = points[edgeIndex].clone().lerp(points[next], edgeT);
    const tangent = points[next].clone().sub(points[edgeIndex]);

    sampledPoints.push(point);
    tangents.push(tangent.lengthSq() > EPSILON ? tangent.normalize() : new THREE.Vector3(1, 0, 0));
  }

  return withDistances(sampledPoints, tangents, closed);
}

function withDistances(
  points: THREE.Vector3[],
  tangents: THREE.Vector3[],
  closed: boolean,
): SampledPath {
  if (points.length < 2) {
    return emptySampledPath(closed);
  }

  const distances = new Array<number>(points.length).fill(0);
  let totalLength = 0;

  for (let i = 1; i < points.length; i += 1) {
    totalLength += points[i - 1].distanceTo(points[i]);
    distances[i] = totalLength;
  }

  if (closed) {
    totalLength += points[points.length - 1].distanceTo(points[0]);
  }

  const progress = distances.map((distance, index) => {
    if (totalLength <= EPSILON) {
      return 0;
    }

    return closed ? index / points.length : clamp(distance / totalLength);
  });

  return {
    points,
    tangents,
    progress,
    distances,
    totalLength,
    closed,
  };
}
