import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { buildRibbonGeometry } from "../src/geometry/buildRibbonGeometry";
import { buildStableFrames } from "../src/geometry/frames";

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

  it("normalizes invalid width callback values", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      {
        segments: 4,
        curveType: "polyline",
        widthCallback: (t) => {
          if (t < 0.25) {
            return Number.NaN;
          }
          if (t < 0.5) {
            return -10;
          }
          if (t < 0.75) {
            return Number.POSITIVE_INFINITY;
          }
          return 100;
        },
      },
    );

    const positions = numericArray(geometry.getAttribute("position") as THREE.BufferAttribute);
    expect(positions.every(Number.isFinite)).toBe(true);
  });

  it("does not let dash options affect geometry output", () => {
    const points = [
      [0, 0, 0],
      [1, 0, 0],
      [2, 1, 0],
    ] as const;
    const baseGeometry = buildRibbonGeometry(points, { segments: 8, curveType: "polyline" });
    const dashedGeometry = buildRibbonGeometry(points, {
      segments: 8,
      curveType: "polyline",
      dash: { enabled: true, size: 0.2, gap: 0.1, phase: 0.5 },
    });

    expect(numericArray(dashedGeometry.getAttribute("position") as THREE.BufferAttribute)).toEqual(
      numericArray(baseGeometry.getAttribute("position") as THREE.BufferAttribute),
    );
    expect(numericArray(dashedGeometry.getIndex() as THREE.BufferAttribute)).toEqual(
      numericArray(baseGeometry.getIndex() as THREE.BufferAttribute),
    );
  });

  it("computes bounds for non-empty geometry", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { segments: 4, curveType: "polyline" },
    );

    expect(geometry.boundingBox).not.toBeNull();
    expect(geometry.boundingSphere).not.toBeNull();
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

  it("keeps frame attributes finite through sharp 3D turns", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
        [0, 2, -1],
        [2, 3, 0],
      ],
      { segments: 24, curveType: "polyline" },
    );

    for (const name of ["position", "normal", "uv", "pathProgress", "side"] as const) {
      const values = numericArray(geometry.getAttribute(name) as THREE.BufferAttribute);
      expect(values.every(Number.isFinite)).toBe(true);
    }
  });

  it("builds finite stable frames for axis-aligned and near-parallel tangents", () => {
    const frames = buildStableFrames(
      [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0.000001, y: 0, z: 1 },
      ].map((value) => new THREE.Vector3(value.x, value.y, value.z)),
    );

    expect(frames).toHaveLength(4);
    for (const frame of frames) {
      expect(frame.tangent.length()).toBeCloseTo(1);
      expect(frame.normal.length()).toBeCloseTo(1);
      expect(frame.side.length()).toBeCloseTo(1);
      expect(
        [frame.tangent, frame.normal, frame.side].every((vector) => Number.isFinite(vector.x)),
      ).toBe(true);
    }
  });
});
