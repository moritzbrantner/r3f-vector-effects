import type * as THREE from "three";
import {
  type RibbonMaterialOptions,
  createFeatheredRibbonMaterial,
} from "./createFeatheredRibbonMaterial";

export function createGradientLineMaterial(
  options: RibbonMaterialOptions = {},
): THREE.ShaderMaterial {
  return createFeatheredRibbonMaterial({
    feather: 0,
    ...options,
  });
}
