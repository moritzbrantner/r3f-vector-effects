import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createTslRibbonMaterial } from "../src/experimental/tsl";
import { createFeatheredRibbonMaterial } from "../src/materials/createFeatheredRibbonMaterial";
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
    expect(material.uniforms.colorStart).toBeDefined();
    expect(material.uniforms.colorEnd).toBeDefined();
    expect(material.uniforms.dashed.value).toBe(1);
    expect(material.uniforms.feather.value).toBe(0.2);
    expect(material.uniforms.dashSize.value).toBe(0.12);
    expect(material.uniforms.dashPhase.value).toBe(0);
    expect(material.uniforms.time.value).toBe(0);
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
    });

    expect(material.uniforms.opacity.value).toBe(1);
    expect(material.uniforms.feather.value).toBe(0.08);
    expect(material.uniforms.glow.value).toBe(0);
    expect(material.uniforms.dashSize.value).toBe(0.12);
    expect(material.uniforms.gapSize.value).toBe(0.08);
    expect(material.uniforms.dashPhase.value).toBe(0);
  });

  it("exposes the experimental TSL ribbon material factory", () => {
    expect(createTslRibbonMaterial).toBeTypeOf("function");
  });
});
