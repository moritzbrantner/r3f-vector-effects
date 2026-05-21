import type * as THREE from "three";
import {
  type FeatheredRibbonMaterialOptions,
  createFeatheredRibbonMaterial,
} from "./createFeatheredRibbonMaterial";

export function createGradientLineMaterial(
  options: FeatheredRibbonMaterialOptions = {},
): THREE.ShaderMaterial {
  return createFeatheredRibbonMaterial({
    feather: 0,
    ...options,
  });
}
