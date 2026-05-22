import * as THREE from "three";
import { EPSILON } from "../utils/math";

export interface RibbonFrame {
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  side: THREE.Vector3;
}

export interface BuildStableFramesOptions {
  /**
   * Preferred frame normal. The builder projects it away from each tangent, so
   * it does not need to be perfectly perpendicular to the path.
   */
  up?: THREE.Vector3 | readonly [number, number, number];
  /**
   * Keep the normal as close as possible to `up` for each sample instead of
   * transporting it from the previous sample. This is useful for object-level
   * billboarding where the mesh is rotated toward the camera by the caller.
   */
  billboard?: boolean;
  epsilon?: number;
}

const PREFERRED_NORMALS = [
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(1, 0, 0),
];

export function buildStableFrames(
  tangents: THREE.Vector3[],
  options: BuildStableFramesOptions = {},
): RibbonFrame[] {
  if (tangents.length === 0) {
    return [];
  }

  const epsilon = Math.max(0, options.epsilon ?? EPSILON);
  const epsilonSq = epsilon * epsilon;
  const preferredUp = normalizeUp(options.up);
  const frames: RibbonFrame[] = [];
  let previousTangent = normalizeTangent(tangents[0]);
  let normal = chooseInitialNormal(previousTangent, preferredUp);

  for (const tangentInput of tangents) {
    const tangent = normalizeTangent(tangentInput);

    // Parallel transport rotates the previous frame by only the tangent delta.
    // That keeps neighboring cross sections coherent without forcing them to
    // snap back to a global axis on every bend, which is the usual source of
    // visible ribbon twisting.
    normal = options.billboard
      ? chooseInitialNormal(tangent, preferredUp)
      : transportNormal(normal, previousTangent, tangent, epsilonSq);

    // Numerical drift can leave the transported normal slightly off-plane.
    // Reproject it so side/normal/tangent remain an orthonormal basis.
    normal = normal.clone().sub(tangent.clone().multiplyScalar(normal.dot(tangent)));
    if (normal.lengthSq() <= epsilonSq) {
      normal = chooseInitialNormal(tangent, preferredUp);
    } else {
      normal.normalize();
    }

    const side = normal.clone().cross(tangent);
    if (side.lengthSq() <= epsilonSq) {
      const fallbackNormal = chooseInitialNormal(tangent, preferredUp);
      side.copy(fallbackNormal).cross(tangent);
    }
    side.normalize();

    normal = tangent.clone().cross(side).normalize();
    frames.push({ tangent, normal: normal.clone(), side });
    previousTangent = tangent;
  }

  return frames;
}

function normalizeTangent(tangentInput: THREE.Vector3): THREE.Vector3 {
  return tangentInput.lengthSq() > EPSILON
    ? tangentInput.clone().normalize()
    : new THREE.Vector3(1, 0, 0);
}

function transportNormal(
  normal: THREE.Vector3,
  previousTangent: THREE.Vector3,
  tangent: THREE.Vector3,
  epsilonSq: number,
): THREE.Vector3 {
  if (previousTangent.distanceToSquared(tangent) <= epsilonSq) {
    return normal.clone();
  }

  const rotation = new THREE.Quaternion().setFromUnitVectors(previousTangent, tangent);
  return normal.clone().applyQuaternion(rotation);
}

function chooseInitialNormal(
  tangentInput: THREE.Vector3,
  preferredUp?: THREE.Vector3,
): THREE.Vector3 {
  const tangent = normalizeTangent(tangentInput);
  const candidates = preferredUp ? [preferredUp, ...PREFERRED_NORMALS] : PREFERRED_NORMALS;

  for (const candidate of candidates) {
    if (Math.abs(candidate.dot(tangent)) < 0.95) {
      return candidate
        .clone()
        .sub(tangent.clone().multiplyScalar(candidate.dot(tangent)))
        .normalize();
    }
  }

  return new THREE.Vector3(0, 0, 1);
}

function normalizeUp(
  up?: THREE.Vector3 | readonly [number, number, number],
): THREE.Vector3 | undefined {
  if (!up) {
    return undefined;
  }

  const vector =
    up instanceof THREE.Vector3
      ? up.clone()
      : Array.isArray(up)
        ? new THREE.Vector3(up[0], up[1], up[2])
        : undefined;

  return vector && vector.lengthSq() > EPSILON ? vector.normalize() : undefined;
}
