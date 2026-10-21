import * as THREE from "three";
import type {
  CurveType,
  DashStyle,
  FeatheredPlaneProps,
  PathSamplingOptions,
  RibbonStyle,
  WidthProfile,
} from "../types";
import { clamp, EPSILON, isFiniteNumber, safePositive } from "../utils/math";

export interface NormalizedSamplingOptions {
  closed: boolean;
  segments: number;
  curveType: CurveType;
  epsilon: number;
}

export interface NormalizedDashStyle {
  enabled: boolean;
  size: number;
  gap: number;
  phase: number;
  units: "progress" | "world";
}

export interface NormalizedRibbonStyle {
  width: number;
  widthProfile: WidthProfile;
  widthCallback?: (t: number) => number;
  feather: number;
  glow: number;
  opacity: number;
  color: THREE.ColorRepresentation;
  colorStart?: THREE.ColorRepresentation;
  colorEnd?: THREE.ColorRepresentation;
  dash: NormalizedDashStyle;
  depthTest: boolean;
  blending: THREE.Blending;
}

export interface NormalizedFeatheredPlaneOptions {
  width: number;
  height: number;
  color: THREE.ColorRepresentation;
  opacity: number;
  feather: number;
  radius: number;
  depthTest: boolean;
}

export function normalizeSamplingOptions(
  options: PathSamplingOptions = {},
): NormalizedSamplingOptions {
  return {
    closed: options.closed ?? false,
    segments: Math.max(1, Math.floor(safePositive(options.segments, 64))),
    curveType:
      options.curveType === "catmullrom" ? "catmull-rom" : (options.curveType ?? "catmull-rom"),
    epsilon: safePositive(options.epsilon, EPSILON),
  };
}

export function normalizeDashStyle(dash?: DashStyle): NormalizedDashStyle {
  return {
    enabled: dash ? (dash.enabled ?? true) : false,
    size: safePositive(dash?.size, 0.12),
    gap: safePositive(dash?.gap, 0.08),
    phase: isFiniteNumber(dash?.phase ?? 0) ? (dash?.phase ?? 0) : 0,
    units: dash?.units === "world" ? "world" : "progress",
  };
}

export function normalizeRibbonStyle(style: RibbonStyle = {}): NormalizedRibbonStyle {
  return {
    width: safePositive(style.width, 0.1),
    widthProfile: style.widthProfile ?? "constant",
    widthCallback: style.customWidthProfile ?? style.widthCallback,
    feather: clampFinite(style.feather, 0.08, 0, 1),
    glow: Math.max(0, finiteOrFallback(style.glow, 0)),
    opacity: clampFinite(style.opacity, 1, 0, 1),
    color: style.color ?? "#ffffff",
    colorStart: style.colorStart,
    colorEnd: style.colorEnd,
    dash: normalizeDashStyle(style.dash),
    depthTest: style.depthTest ?? true,
    blending: style.blending ?? THREE.NormalBlending,
  };
}

export function normalizeFeatheredPlaneOptions(
  options: FeatheredPlaneProps,
): NormalizedFeatheredPlaneOptions {
  return {
    width: safePositive(options.width, 1),
    height: safePositive(options.height, 1),
    color: options.color ?? "#111827",
    opacity: clampFinite(options.opacity, 0.75, 0, 1),
    feather: clampFinite(options.feather, 0.08, 0, 1),
    radius: Math.max(0, finiteOrFallback(options.radius, 0)),
    depthTest: options.depthTest ?? true,
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
