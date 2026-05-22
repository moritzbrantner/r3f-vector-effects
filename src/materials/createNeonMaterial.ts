import * as THREE from "three";
import {
  type RibbonMaterialOptions,
  createFeatheredRibbonMaterial,
} from "./createFeatheredRibbonMaterial";

export function createNeonMaterial(options: RibbonMaterialOptions = {}): THREE.ShaderMaterial {
  return createFeatheredRibbonMaterial({
    feather: 0.35,
    glow: 1,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    ...options,
  });
}
