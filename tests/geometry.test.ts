import type * as THREE from "three";
import { describe, expect, it } from "vitest";
import { buildRibbonGeometry } from "../src/geometry/buildRibbonGeometry";

function numericArray(attribute: THREE.BufferAttribute): number[] {
  return Array.from(attribute.array as ArrayLike<number>);
}

describe("buildRibbonGeometry", () => {
  it("returns empty geometry for fewer than two valid points", () => {
    const geometry = buildRibbonGeometry([[0, 0, 0]], { segments: 8 });

    expect(geometry.getAttribute("position").count).toBe(0);
    expect(geometry.getAttribute("uv").count).toBe(0);
    expect(geometry.getIndex()?.count ?? 0).toBe(0);
  });

  it("builds two vertices per sampled point and indexed triangles between segments", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { segments: 4, curveType: "polyline", width: 0.2 },
    );

    expect(geometry.getAttribute("position").count).toBe(10);
    expect(geometry.getAttribute("normal").count).toBe(10);
    expect(geometry.getAttribute("uv").count).toBe(10);
    expect(geometry.getAttribute("pathProgress").count).toBe(10);
    expect(geometry.getAttribute("side").count).toBe(10);
    expect(geometry.getIndex()?.count).toBe(24);
  });

  it("keeps uv coordinates and progress in the normalized range", () => {
    const geometry = buildRibbonGeometry(
      [
        [-1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
      ],
      { segments: 16, widthProfile: "taper" },
    );

    const uv = numericArray(geometry.getAttribute("uv") as THREE.BufferAttribute);
    const progress = numericArray(geometry.getAttribute("pathProgress") as THREE.BufferAttribute);

    for (const value of uv) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }

    for (const value of progress) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("does not emit NaN values for duplicate points or tiny segments", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [0, 0, 0],
        [0.000000001, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { segments: 10, width: 0.1 },
    );

    const attributes = ["position", "normal", "uv", "pathProgress", "side"] as const;
    for (const name of attributes) {
      const values = numericArray(geometry.getAttribute(name) as THREE.BufferAttribute);
      expect(values.every(Number.isFinite)).toBe(true);
    }
  });

  it("adds closing triangles for closed paths", () => {
    const openGeometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { segments: 6, closed: false, curveType: "polyline" },
    );
    const closedGeometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { segments: 6, closed: true, curveType: "polyline" },
    );

    const openSampleCount = openGeometry.getAttribute("position").count / 2;
    const closedSampleCount = closedGeometry.getAttribute("position").count / 2;

    expect(openGeometry.getIndex()?.count).toBe((openSampleCount - 1) * 6);
    expect(closedGeometry.getIndex()?.count).toBe(closedSampleCount * 6);
  });
});
