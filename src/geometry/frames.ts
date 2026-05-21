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
  let normal = chooseInitialNormal(tangents[0]);

  for (const tangentInput of tangents) {
    const tangent =
      tangentInput.lengthSq() > EPSILON
        ? tangentInput.clone().normalize()
        : new THREE.Vector3(1, 0, 0);

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
  }

  return frames;
}

function chooseInitialNormal(tangentInput: THREE.Vector3): THREE.Vector3 {
  const tangent =
    tangentInput.lengthSq() > EPSILON
      ? tangentInput.clone().normalize()
      : new THREE.Vector3(1, 0, 0);

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
