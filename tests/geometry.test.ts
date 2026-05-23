import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createVectorPathGeometry } from "../src/components/VectorPath3D";
import { buildRibbonGeometry } from "../src/geometry/buildRibbonGeometry";
import { buildStableFrames } from "../src/geometry/frames";

function numericArray(attribute: THREE.BufferAttribute): number[] {
  return Array.from(attribute.array as ArrayLike<number>);
}

function numericAttributes(geometry: THREE.BufferGeometry): THREE.BufferAttribute[] {
  return Object.keys(geometry.attributes).map(
    (name) => geometry.getAttribute(name) as THREE.BufferAttribute,
  );
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
    expect(geometry.getAttribute("pathDistance").count).toBe(10);
    expect(geometry.getAttribute("side").count).toBe(10);
    expect(geometry.getAttribute("width").count).toBe(10);
    expect(geometry.getIndex()?.count).toBe(24);
  });

  it("builds a finite three-point curved ribbon", () => {
    const geometry = buildRibbonGeometry(
      [
        [-1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
      ],
      { segments: 12, curveType: "catmull-rom", width: 0.2 },
    );

    expect(geometry.getAttribute("position").count).toBe(26);
    for (const attribute of numericAttributes(geometry)) {
      expect(numericArray(attribute).every(Number.isFinite)).toBe(true);
    }
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
    const distance = numericArray(geometry.getAttribute("pathDistance") as THREE.BufferAttribute);
    const uvX = uv.filter((_, index) => index % 2 === 0);

    for (const value of uvX) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }

    for (const value of progress) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }

    expect(distance.every(Number.isFinite)).toBe(true);
  });

  it("writes finite monotonic pathDistance values for open paths", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 2, 0],
      ],
      { segments: 6, curveType: "polyline" },
    );

    const distancePairs = numericArray(
      geometry.getAttribute("pathDistance") as THREE.BufferAttribute,
    );
    const distances = distancePairs.filter((_, index) => index % 2 === 0);

    expect(distances[0]).toBe(0);
    expect(distances[distances.length - 1]).toBeCloseTo(3);
    for (let index = 1; index < distances.length; index += 1) {
      expect(distances[index]).toBeGreaterThanOrEqual(distances[index - 1]);
    }
  });

  it("writes finite pathDistance values for closed paths", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { segments: 9, closed: true, curveType: "polyline" },
    );

    const distances = numericArray(geometry.getAttribute("pathDistance") as THREE.BufferAttribute);
    expect(distances.every(Number.isFinite)).toBe(true);
    expect(Math.max(...distances)).toBeGreaterThan(0);
  });

  it("writes side values as only -1 and +1", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { segments: 8, curveType: "polyline" },
    );

    const sides = numericArray(geometry.getAttribute("side") as THREE.BufferAttribute);
    expect(new Set(sides)).toEqual(new Set([-1, 1]));
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

    for (const attribute of numericAttributes(geometry)) {
      expect(numericArray(attribute).every(Number.isFinite)).toBe(true);
    }
  });

  it("returns an empty geometry for invalid runtime inputs", () => {
    const geometry = buildRibbonGeometry(
      null as unknown as Parameters<typeof buildRibbonGeometry>[0],
    );

    expect(geometry.getAttribute("position").count).toBe(0);
    expect(geometry.getAttribute("width").count).toBe(0);
    expect(geometry.getIndex()?.count ?? 0).toBe(0);
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

  it("applies built-in width profiles to the width attribute", () => {
    const points = [
      [0, 0, 0],
      [1, 0, 0],
    ] as const;

    const constant = buildRibbonGeometry(points, {
      segments: 8,
      curveType: "polyline",
      width: 0.2,
      widthProfile: "constant",
    });
    const taper = buildRibbonGeometry(points, {
      segments: 8,
      curveType: "polyline",
      width: 0.2,
      widthProfile: "taper",
    });

    expect(numericArray(constant.getAttribute("width") as THREE.BufferAttribute)).not.toEqual(
      numericArray(taper.getAttribute("width") as THREE.BufferAttribute),
    );
  });

  it("applies customWidthProfile to the width attribute", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      {
        segments: 4,
        curveType: "polyline",
        width: 0.5,
        customWidthProfile: (t) => 0.5 + t,
      },
    );

    const widths = numericArray(geometry.getAttribute("width") as THREE.BufferAttribute);
    expect(widths[0]).toBeCloseTo(0.25);
    expect(widths[widths.length - 1]).toBeCloseTo(0.75);
  });

  it("lets VectorPath3D geometry use customWidthProfile ahead of widthCallback", () => {
    const geometry = createVectorPathGeometry({
      points: [
        [0, 0, 0],
        [1, 0, 0],
      ],
      segments: 4,
      curveType: "polyline",
      width: 0.5,
      widthCallback: () => 2,
      customWidthProfile: (t) => 0.5 + t,
    });

    const widths = numericArray(geometry.getAttribute("width") as THREE.BufferAttribute);
    expect(widths[0]).toBeCloseTo(0.25);
    expect(widths[widths.length - 1]).toBeCloseTo(0.75);
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

    for (const attribute of numericAttributes(geometry)) {
      expect(numericArray(attribute).every(Number.isFinite)).toBe(true);
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
