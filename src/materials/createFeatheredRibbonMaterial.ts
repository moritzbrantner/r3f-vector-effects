import * as THREE from "three";
import type { FeatheredRibbonMaterialOptions as BaseFeatheredRibbonMaterialOptions } from "../types";
import { cloneColor } from "../utils/color";
import { EPSILON, clamp, isFiniteNumber } from "../utils/math";
import { ribbonFragmentShader } from "./shaders/ribbonFragment.glsl";
import { ribbonVertexShader } from "./shaders/ribbonVertex.glsl";

export type FeatheredRibbonMaterialOptions = BaseFeatheredRibbonMaterialOptions;
export type RibbonMaterialOptions = FeatheredRibbonMaterialOptions;

interface NormalizedFeatheredRibbonMaterialOptions {
  colorStart: THREE.Color;
  colorEnd: THREE.Color;
  opacity: number;
  feather: number;
  glow: number;
  dashed: boolean;
  dashSize: number;
  gapSize: number;
  dashPhase: number;
  dashUnits: "progress" | "world";
  alphaTest: number;
  depthTest: boolean;
  depthWrite: boolean;
  transparent: boolean;
  blending: THREE.Blending;
  fade: number;
  animated: boolean;
  pulseSpeed: number;
}

export function createFeatheredRibbonMaterial(
  options: FeatheredRibbonMaterialOptions = {},
): THREE.ShaderMaterial {
  const style = normalizeFeatheredRibbonMaterialOptions(options);

  return new THREE.ShaderMaterial({
    name: "R3FVectorEffectsFeatheredRibbonMaterial",
    transparent: style.transparent,
    depthWrite: style.depthWrite,
    depthTest: style.depthTest,
    alphaTest: style.alphaTest,
    blending: style.blending,
    uniforms: {
      colorStart: { value: style.colorStart },
      colorEnd: { value: style.colorEnd },
      opacity: { value: style.opacity },
      feather: { value: style.feather },
      glow: { value: style.glow },
      dashed: { value: style.dashed ? 1 : 0 },
      dashSize: { value: style.dashSize },
      gapSize: { value: style.gapSize },
      dashPhase: { value: style.dashPhase },
      dashUnits: { value: style.dashUnits === "world" ? 1 : 0 },
      alphaTest: { value: style.alphaTest },
      fade: { value: style.fade },
      time: { value: 0 },
      animated: { value: style.animated ? 1 : 0 },
      pulseSpeed: { value: style.pulseSpeed },
    },
    vertexShader: ribbonVertexShader,
    fragmentShader: ribbonFragmentShader,
  });
}

export function updateMaterialUniforms(
  material: THREE.ShaderMaterial,
  options: FeatheredRibbonMaterialOptions = {},
): THREE.ShaderMaterial {
  const style = normalizeFeatheredRibbonMaterialOptions(options);

  material.uniforms.colorStart.value.copy(style.colorStart);
  material.uniforms.colorEnd.value.copy(style.colorEnd);
  material.uniforms.opacity.value = style.opacity;
  material.uniforms.feather.value = style.feather;
  material.uniforms.glow.value = style.glow;
  material.uniforms.dashed.value = style.dashed ? 1 : 0;
  material.uniforms.dashSize.value = style.dashSize;
  material.uniforms.gapSize.value = style.gapSize;
  material.uniforms.dashPhase.value = style.dashPhase;
  material.uniforms.dashUnits.value = style.dashUnits === "world" ? 1 : 0;
  material.uniforms.alphaTest.value = style.alphaTest;
  material.uniforms.fade.value = style.fade;
  material.uniforms.animated.value = style.animated ? 1 : 0;
  material.uniforms.pulseSpeed.value = style.pulseSpeed;

  material.transparent = style.transparent;
  material.depthTest = style.depthTest;
  material.depthWrite = style.depthWrite;
  material.alphaTest = style.alphaTest;
  material.blending = style.blending;
  material.needsUpdate = true;

  return material;
}

function normalizeFeatheredRibbonMaterialOptions(
  options: FeatheredRibbonMaterialOptions,
): NormalizedFeatheredRibbonMaterialOptions {
  const color = options.color ?? "#ffffff";
  const dashUnits = options.dash?.units === "world" ? "world" : "progress";
  const normalizeDashLength = dashUnits === "world" ? positiveOrFallback : normalizedProgressLength;
  const dashSize = normalizeDashLength(options.dashSize ?? options.dash?.size, 0.12);
  const gapSize = normalizeDashLength(options.gapSize ?? options.dash?.gap, 0.08);

  return {
    colorStart: cloneColor(options.colorStart ?? color),
    colorEnd: cloneColor(options.colorEnd ?? color),
    opacity: clampFinite(options.opacity, 1, 0, 1),
    feather: clampFinite(options.feather, 0.08, 0, 1),
    glow: Math.max(0, finiteOrFallback(options.glow, 0)),
    dashed: options.dashed ?? (options.dash ? (options.dash.enabled ?? true) : false),
    dashSize,
    gapSize,
    dashPhase: finiteOrFallback(options.dashPhase ?? options.dash?.phase, 0),
    dashUnits,
    alphaTest: clampFinite(options.alphaTest, 0.001, 0, 1),
    depthTest: options.depthTest ?? true,
    depthWrite: options.depthWrite ?? false,
    transparent: options.transparent ?? true,
    blending: options.blending ?? THREE.NormalBlending,
    fade: clampFinite(options.fade, 0, 0, 10),
    animated: options.animated ?? false,
    pulseSpeed: positiveOrFallback(options.pulseSpeed, 1),
  };
}

function finiteOrFallback(value: number | undefined, fallback: number): number {
  return value !== undefined && isFiniteNumber(value) ? value : fallback;
}

function clampFinite(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  return clamp(finiteOrFallback(value, fallback), min, max);
}

function positiveOrFallback(value: number | undefined, fallback: number): number {
  const normalized = finiteOrFallback(value, fallback);
  return normalized > EPSILON ? normalized : fallback;
}

function normalizedProgressLength(value: number | undefined, fallback: number): number {
  return clamp(positiveOrFallback(value, fallback), EPSILON, 1);
}
