import * as THREE from "three";
import {
  type FeatheredRibbonMaterialOptions,
  createFeatheredRibbonMaterial,
} from "./createFeatheredRibbonMaterial";

export function createNeonMaterial(
  options: FeatheredRibbonMaterialOptions = {},
): THREE.ShaderMaterial {
  return createFeatheredRibbonMaterial({
    feather: 0.35,
    glow: 1,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    ...options,
  });
}
