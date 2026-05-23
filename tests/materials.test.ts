import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createTslRibbonMaterial } from "../src/experimental/tsl";
import {
  createFeatheredRibbonMaterial,
  updateMaterialUniforms,
} from "../src/materials/createFeatheredRibbonMaterial";
import { createGradientLineMaterial } from "../src/materials/createGradientLineMaterial";
import { createNeonMaterial } from "../src/materials/createNeonMaterial";

describe("materials", () => {
  it("creates a feathered ribbon shader with expected uniforms", () => {
    const material = createFeatheredRibbonMaterial({
      colorStart: "#ff0000",
      colorEnd: "#0000ff",
      dash: { enabled: true },
      feather: 0.2,
    });

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.transparent).toBe(true);
    expect(Object.keys(material.uniforms).sort()).toEqual([
      "alphaTest",
      "animated",
      "colorEnd",
      "colorStart",
      "dashPhase",
      "dashSize",
      "dashUnits",
      "dashed",
      "fade",
      "feather",
      "gapSize",
      "glow",
      "opacity",
      "pulseSpeed",
      "time",
    ]);
    expect(material.uniforms.dashed.value).toBe(1);
    expect(material.uniforms.feather.value).toBe(0.2);
    expect(material.uniforms.dashSize.value).toBe(0.12);
    expect(material.uniforms.gapSize.value).toBe(0.08);
    expect(material.uniforms.dashPhase.value).toBe(0);
    expect(material.uniforms.dashUnits.value).toBe(0);
    expect(material.uniforms.time.value).toBe(0);
  });

  it("supports flat dashed options and converts gradient colors", () => {
    const material = createFeatheredRibbonMaterial({
      colorStart: "#ff0000",
      colorEnd: "#0000ff",
      dashed: true,
      dashSize: 0.25,
      gapSize: 0.05,
      transparent: false,
      depthTest: false,
      depthWrite: true,
      alphaTest: 0.2,
    });

    expect(material.uniforms.colorStart.value).toBeInstanceOf(THREE.Color);
    expect(material.uniforms.colorStart.value.equals(new THREE.Color("#ff0000"))).toBe(true);
    expect(material.uniforms.colorEnd.value).toBeInstanceOf(THREE.Color);
    expect(material.uniforms.colorEnd.value.equals(new THREE.Color("#0000ff"))).toBe(true);
    expect(material.uniforms.dashed.value).toBe(1);
    expect(material.uniforms.dashSize.value).toBe(0.25);
    expect(material.uniforms.gapSize.value).toBe(0.05);
    expect(material.transparent).toBe(false);
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(true);
    expect(material.alphaTest).toBe(0.2);
    expect(material.uniforms.alphaTest.value).toBe(0.2);
  });

  it("creates a hard-edged gradient line material", () => {
    const material = createGradientLineMaterial({ colorStart: "white", colorEnd: "black" });

    expect(material.uniforms.feather.value).toBe(0);
  });

  it("creates additive neon material", () => {
    const material = createNeonMaterial({ color: "#66ccff" });

    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.depthTest).toBe(false);
    expect(material.uniforms.glow.value).toBe(1);
  });

  it("normalizes invalid numeric material options", () => {
    const material = createFeatheredRibbonMaterial({
      opacity: Number.NaN,
      feather: Number.POSITIVE_INFINITY,
      glow: -1,
      dash: { enabled: true, size: -1, gap: Number.NaN, phase: Number.POSITIVE_INFINITY },
      alphaTest: Number.NEGATIVE_INFINITY,
    });

    expect(material.uniforms.opacity.value).toBe(1);
    expect(material.uniforms.feather.value).toBe(0.08);
    expect(material.uniforms.glow.value).toBe(0);
    expect(material.uniforms.dashSize.value).toBe(0.12);
    expect(material.uniforms.gapSize.value).toBe(0.08);
    expect(material.uniforms.dashPhase.value).toBe(0);
    expect(material.alphaTest).toBe(0.001);
    expect(material.uniforms.alphaTest.value).toBe(0.001);
  });

  it("clamps out-of-range opacity, feather, and alphaTest values", () => {
    const material = createFeatheredRibbonMaterial({
      opacity: 2,
      feather: -1,
      alphaTest: 2,
    });

    expect(material.uniforms.opacity.value).toBe(1);
    expect(material.uniforms.feather.value).toBe(0);
    expect(material.alphaTest).toBe(1);
    expect(material.uniforms.alphaTest.value).toBe(1);
  });

  it("supports progress-unit dashes", () => {
    const material = createFeatheredRibbonMaterial({
      dash: { enabled: true, units: "progress", size: 0.2, gap: 0.15, phase: 0.25 },
    });

    expect(material.uniforms.dashed.value).toBe(1);
    expect(material.uniforms.dashUnits.value).toBe(0);
    expect(material.uniforms.dashSize.value).toBe(0.2);
    expect(material.uniforms.gapSize.value).toBe(0.15);
    expect(material.uniforms.dashPhase.value).toBe(0.25);
  });

  it("supports world-unit dashes without clamping dash length to normalized progress", () => {
    const material = createFeatheredRibbonMaterial({
      dash: { enabled: true, units: "world", size: 4, gap: 2, phase: 0.5 },
    });

    expect(material.uniforms.dashed.value).toBe(1);
    expect(material.uniforms.dashUnits.value).toBe(1);
    expect(material.uniforms.dashSize.value).toBe(4);
    expect(material.uniforms.gapSize.value).toBe(2);
    expect(material.uniforms.dashPhase.value).toBe(0.5);
  });

  it("normalizes invalid dash units back to progress units", () => {
    const material = createFeatheredRibbonMaterial({
      dash: {
        enabled: true,
        units: "screen" as unknown as "progress",
        size: 10,
        gap: 2,
      },
    });

    expect(material.uniforms.dashUnits.value).toBe(0);
    expect(material.uniforms.dashSize.value).toBe(1);
    expect(material.uniforms.gapSize.value).toBe(1);
  });

  it("updates material uniforms and flags without replacing the material", () => {
    const material = createFeatheredRibbonMaterial({ color: "white" });
    const colorStart = material.uniforms.colorStart.value;
    const colorEnd = material.uniforms.colorEnd.value;
    const version = material.version;
    const sameMaterial = updateMaterialUniforms(material, {
      colorStart: "red",
      colorEnd: "blue",
      opacity: 0.5,
      feather: 0.25,
      glow: 0.75,
      dashed: true,
      dashSize: 0.3,
      gapSize: 0.1,
      dashPhase: 0.2,
      dash: { units: "world" },
      depthTest: false,
      depthWrite: true,
      transparent: false,
      alphaTest: 0.4,
      blending: THREE.AdditiveBlending,
      fade: 2,
      animated: true,
      pulseSpeed: 3,
    });

    expect(sameMaterial).toBe(material);
    expect(material.uniforms.colorStart.value).toBe(colorStart);
    expect(material.uniforms.colorEnd.value).toBe(colorEnd);
    expect(material.uniforms.colorStart.value.equals(new THREE.Color("red"))).toBe(true);
    expect(material.uniforms.colorEnd.value.equals(new THREE.Color("blue"))).toBe(true);
    expect(material.uniforms.opacity.value).toBe(0.5);
    expect(material.uniforms.feather.value).toBe(0.25);
    expect(material.uniforms.glow.value).toBe(0.75);
    expect(material.uniforms.dashed.value).toBe(1);
    expect(material.uniforms.dashSize.value).toBe(0.3);
    expect(material.uniforms.gapSize.value).toBe(0.1);
    expect(material.uniforms.dashPhase.value).toBe(0.2);
    expect(material.uniforms.dashUnits.value).toBe(1);
    expect(material.uniforms.alphaTest.value).toBe(0.4);
    expect(material.uniforms.fade.value).toBe(2);
    expect(material.uniforms.animated.value).toBe(1);
    expect(material.uniforms.pulseSpeed.value).toBe(3);
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(true);
    expect(material.transparent).toBe(false);
    expect(material.alphaTest).toBe(0.4);
    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.version).toBeGreaterThan(version);
  });

  it("normalizes unsafe flat dash and gap values", () => {
    const material = createFeatheredRibbonMaterial({
      dashed: true,
      dashSize: Number.MIN_VALUE,
      gapSize: 0,
    });

    expect(material.uniforms.dashSize.value).toBe(0.12);
    expect(material.uniforms.gapSize.value).toBe(0.08);
  });

  it("clamps dash and gap values to normalized progress units", () => {
    const material = createFeatheredRibbonMaterial({
      dashed: true,
      dashSize: 10,
      gapSize: 2,
    });

    expect(material.uniforms.dashSize.value).toBe(1);
    expect(material.uniforms.gapSize.value).toBe(1);
  });

  it("exposes the experimental TSL ribbon material factory", () => {
    expect(createTslRibbonMaterial).toBeTypeOf("function");
  });
});
