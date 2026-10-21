import type * as THREE from "three";
import {
  createFeatheredRibbonMaterial,
  type RibbonMaterialOptions,
} from "./createFeatheredRibbonMaterial";

export function createGradientLineMaterial(
  options: RibbonMaterialOptions = {},
): THREE.ShaderMaterial {
  return createFeatheredRibbonMaterial({
    feather: 0,
    ...options,
  });
}
