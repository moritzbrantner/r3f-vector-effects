import * as THREE from "three";
import { normalizeRibbonStyle } from "../core/normalize";
import type { RibbonStyle } from "../types";
import { cloneColor } from "../utils/color";
import { ribbonFragmentShader } from "./shaders/ribbonFragment.glsl";
import { ribbonVertexShader } from "./shaders/ribbonVertex.glsl";

export interface RibbonMaterialOptions extends RibbonStyle {
  fade?: number;
  animated?: boolean;
  pulseSpeed?: number;
}

export type FeatheredRibbonMaterialOptions = RibbonMaterialOptions;

export function createFeatheredRibbonMaterial(
  options: RibbonMaterialOptions = {},
): THREE.ShaderMaterial {
  const style = normalizeRibbonStyle(options);
  const colorStart = cloneColor(style.colorStart ?? style.color);
  const colorEnd = cloneColor(style.colorEnd ?? style.color);

  return new THREE.ShaderMaterial({
    name: "R3FVectorEffectsFeatheredRibbonMaterial",
    transparent: true,
    depthWrite: false,
    depthTest: style.depthTest,
    blending: style.blending,
    uniforms: {
      colorStart: { value: colorStart },
      colorEnd: { value: colorEnd },
      opacity: { value: style.opacity },
      feather: { value: style.feather },
      glow: { value: style.glow },
      dashed: { value: style.dash.enabled ? 1 : 0 },
      dashSize: { value: style.dash.size },
      gapSize: { value: style.dash.gap },
      dashPhase: { value: style.dash.phase },
      fade: { value: options.fade ?? 0 },
      time: { value: 0 },
      animated: { value: options.animated ? 1 : 0 },
      pulseSpeed: { value: options.pulseSpeed ?? 1 },
    },
    vertexShader: ribbonVertexShader,
    fragmentShader: ribbonFragmentShader,
  });
}
