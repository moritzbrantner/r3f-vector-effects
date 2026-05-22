import * as THREE from "three";
import { EPSILON } from "../utils/math";

export interface RibbonFrame {
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  side: THREE.Vector3;
}

const PREFERRED_NORMALS = [
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(1, 0, 0),
];

export function buildStableFrames(tangents: THREE.Vector3[]): RibbonFrame[] {
  if (tangents.length === 0) {
    return [];
  }

  const frames: RibbonFrame[] = [];
  let previousTangent = normalizeTangent(tangents[0]);
  let normal = chooseInitialNormal(previousTangent);

  for (const tangentInput of tangents) {
    const tangent = normalizeTangent(tangentInput);
    normal = transportNormal(normal, previousTangent, tangent);

    normal = normal.clone().sub(tangent.clone().multiplyScalar(normal.dot(tangent)));
    if (normal.lengthSq() <= EPSILON) {
      normal = chooseInitialNormal(tangent);
    } else {
      normal.normalize();
    }

    const side = normal.clone().cross(tangent);
    if (side.lengthSq() <= EPSILON) {
      const fallbackNormal = chooseInitialNormal(tangent);
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
): THREE.Vector3 {
  if (previousTangent.distanceToSquared(tangent) <= EPSILON * EPSILON) {
    return normal.clone();
  }

  const rotation = new THREE.Quaternion().setFromUnitVectors(previousTangent, tangent);
  return normal.clone().applyQuaternion(rotation);
}

function chooseInitialNormal(tangentInput: THREE.Vector3): THREE.Vector3 {
  const tangent = normalizeTangent(tangentInput);

  for (const candidate of PREFERRED_NORMALS) {
    if (Math.abs(candidate.dot(tangent)) < 0.95) {
      return candidate
        .clone()
        .sub(tangent.clone().multiplyScalar(candidate.dot(tangent)))
        .normalize();
    }
  }

  return new THREE.Vector3(0, 0, 1);
}
