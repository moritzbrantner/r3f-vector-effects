import * as THREE from "three";
import {
  abs,
  add,
  attribute,
  clamp,
  color,
  float,
  max,
  mix,
  mod,
  mul,
  oneMinus,
  pow,
  smoothstep,
  step,
  sub,
  uv,
} from "three/tsl";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { normalizeRibbonStyle } from "../core/normalize";
import type { RibbonMaterialOptions } from "./createFeatheredRibbonMaterial";

export function createTslRibbonMaterial(options: RibbonMaterialOptions = {}): THREE.Material {
  const style = normalizeRibbonStyle({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    ...options,
  });
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: style.depthTest,
    blending: style.blending,
  });
  const progress = clamp(attribute("pathProgress", "float"), 0, 1);
  const edgeDistance = oneMinus(abs(sub(mul(uv().y, 2), 1)));
  const edgeAlpha = smoothstep(0, Math.max(style.feather, 0.0001), edgeDistance);
  const glowAlpha = mul(
    pow(max(edgeDistance, 0), 1 / (1 + style.glow * 3)),
    style.glow > 0 ? 0.75 : 0,
  );
  const dashAlpha = style.dash.enabled
    ? step(mod(add(progress, style.dash.phase), style.dash.size + style.dash.gap), style.dash.size)
    : float(1);

  material.colorNode = mix(
    color(style.colorStart ?? style.color),
    color(style.colorEnd ?? style.color),
    progress,
  );
  material.opacityNode = mul(max(edgeAlpha, glowAlpha), dashAlpha, style.opacity);
  return material;
}
