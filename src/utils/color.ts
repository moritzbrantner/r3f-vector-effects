import * as THREE from "three";

export function toColor(
  value: THREE.ColorRepresentation | undefined,
  fallback: string,
): THREE.Color {
  return new THREE.Color(value ?? fallback);
}

export function cloneColor(value: THREE.ColorRepresentation | THREE.Color): THREE.Color {
  return value instanceof THREE.Color ? value.clone() : new THREE.Color(value);
}
