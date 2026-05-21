import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createFeatheredRibbonMaterial } from "../src/materials/createFeatheredRibbonMaterial";
import { createGradientLineMaterial } from "../src/materials/createGradientLineMaterial";
import { createNeonMaterial } from "../src/materials/createNeonMaterial";

describe("materials", () => {
  it("creates a feathered ribbon shader with expected uniforms", () => {
    const material = createFeatheredRibbonMaterial({
      colorStart: "#ff0000",
      colorEnd: "#0000ff",
      dashed: true,
      feather: 0.2,
    });

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.transparent).toBe(true);
    expect(material.uniforms.colorStart).toBeDefined();
    expect(material.uniforms.colorEnd).toBeDefined();
    expect(material.uniforms.dashed.value).toBe(1);
    expect(material.uniforms.feather.value).toBe(0.2);
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
});
