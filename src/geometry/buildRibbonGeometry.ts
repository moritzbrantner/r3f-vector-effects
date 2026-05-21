import * as THREE from "three";
import type { CurveType, VectorEffectPoint, WidthProfile } from "../types";
import { clamp, safePositive } from "../utils/math";
import { buildStableFrames } from "./frames";
import { sampleCurve } from "./sampleCurve";

export interface BuildRibbonGeometryOptions {
  closed?: boolean;
  segments?: number;
  curveType?: CurveType;
  width?: number;
  widthProfile?: WidthProfile;
  widthCallback?: (t: number) => number;
}

export function buildRibbonGeometry(
  points: VectorEffectPoint[],
  options: BuildRibbonGeometryOptions = {},
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const sampled = sampleCurve(points, options);

  if (sampled.points.length < 2) {
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute([], 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute([], 2));
    geometry.setAttribute("pathProgress", new THREE.Float32BufferAttribute([], 1));
    geometry.setAttribute("side", new THREE.Float32BufferAttribute([], 1));
    geometry.setIndex([]);
    return geometry;
  }

  const baseWidth = safePositive(options.width, 0.1);
  const frames = buildStableFrames(sampled.tangents);
  const vertexCount = sampled.points.length * 2;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const pathProgress = new Float32Array(vertexCount);
  const sideAttribute = new Float32Array(vertexCount);

  for (let i = 0; i < sampled.points.length; i += 1) {
    const t = sampled.progress[i];
    const width = baseWidth * widthMultiplier(t, options);
    const halfWidth = width / 2;
    const point = sampled.points[i];
    const frame = frames[i];

    writeVertex({
      index: i * 2,
      sideSign: -1,
      point,
      side: frame.side,
      normal: frame.normal,
      halfWidth,
      progress: t,
      positions,
      normals,
      uvs,
      pathProgress,
      sideAttribute,
    });

    writeVertex({
      index: i * 2 + 1,
      sideSign: 1,
      point,
      side: frame.side,
      normal: frame.normal,
      halfWidth,
      progress: t,
      positions,
      normals,
      uvs,
      pathProgress,
      sideAttribute,
    });
  }

  const segmentCount = options.closed ? sampled.points.length : sampled.points.length - 1;
  const indices: number[] = [];
  for (let i = 0; i < segmentCount; i += 1) {
    const next = (i + 1) % sampled.points.length;
    const a = i * 2;
    const b = a + 1;
    const c = next * 2;
    const d = c + 1;
    indices.push(a, c, b, c, d, b);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("pathProgress", new THREE.BufferAttribute(pathProgress, 1));
  geometry.setAttribute("side", new THREE.BufferAttribute(sideAttribute, 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  return geometry;
}

function widthMultiplier(t: number, options: BuildRibbonGeometryOptions): number {
  if (options.widthCallback) {
    return clamp(options.widthCallback(t), 0, 10);
  }

  switch (options.widthProfile ?? "constant") {
    case "taper":
      return 0.15 + 0.85 * Math.sin(Math.PI * t);
    case "calligraphy":
      return 0.3 + 0.7 * Math.sin(Math.PI * t) ** 0.55;
    case "pulse":
      return 0.7 + 0.3 * Math.sin(Math.PI * 8 * t);
    default:
      return 1;
  }
}

interface WriteVertexOptions {
  index: number;
  sideSign: -1 | 1;
  point: THREE.Vector3;
  side: THREE.Vector3;
  normal: THREE.Vector3;
  halfWidth: number;
  progress: number;
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  pathProgress: Float32Array;
  sideAttribute: Float32Array;
}

function writeVertex(options: WriteVertexOptions): void {
  const offset = options.index * 3;
  const uvOffset = options.index * 2;
  const edge = options.point
    .clone()
    .add(options.side.clone().multiplyScalar(options.sideSign * options.halfWidth));

  options.positions[offset] = edge.x;
  options.positions[offset + 1] = edge.y;
  options.positions[offset + 2] = edge.z;

  options.normals[offset] = options.normal.x;
  options.normals[offset + 1] = options.normal.y;
  options.normals[offset + 2] = options.normal.z;

  options.uvs[uvOffset] = options.progress;
  options.uvs[uvOffset + 1] = options.sideSign < 0 ? 0 : 1;

  options.pathProgress[options.index] = options.progress;
  options.sideAttribute[options.index] = options.sideSign;
}
