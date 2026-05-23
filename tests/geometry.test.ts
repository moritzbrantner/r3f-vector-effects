import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createVectorPathGeometry } from "../src/components/VectorPath3D";
import { buildRibbonGeometry } from "../src/geometry/buildRibbonGeometry";
import { buildTubePathGeometry } from "../src/geometry/buildTubePathGeometry";
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
  it("creates the expected public attributes for valid paths", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { segments: 3, curveType: "polyline" },
    );

    expect(Object.keys(geometry.attributes).sort()).toEqual([
      "normal",
      "pathDistance",
      "pathProgress",
      "position",
      "side",
      "uv",
      "width",
    ]);
    expect(geometry.getIndex()).toBeInstanceOf(THREE.BufferAttribute);
  });

  it("returns empty geometry for fewer than two valid points", () => {
    const geometry = buildRibbonGeometry([[0, 0, 0]], { segments: 8 });

    expect(geometry.getAttribute("position").count).toBe(0);
    expect(geometry.getAttribute("uv").count).toBe(0);
    expect(geometry.getIndex()?.count ?? 0).toBe(0);
  });

  it("returns empty geometry for empty, invalid, or duplicate-only paths", () => {
    const cases: readonly (readonly [number, number, number][])[] = [
      [],
      [
        [Number.NaN, 0, 0],
        [Number.POSITIVE_INFINITY, 0, 0],
      ],
      [
        [0, 0, 0],
        [0, 0, 0],
        [0.000001, 0, 0],
      ],
    ];

    for (const points of cases) {
      const geometry = buildRibbonGeometry(points, { segments: 8, curveType: "polyline" });

      expect(geometry.getAttribute("position").count).toBe(0);
      expect(geometry.getAttribute("normal").count).toBe(0);
      expect(geometry.getAttribute("uv").count).toBe(0);
      expect(geometry.getAttribute("pathProgress").count).toBe(0);
      expect(geometry.getAttribute("pathDistance").count).toBe(0);
      expect(geometry.getAttribute("side").count).toBe(0);
      expect(geometry.getAttribute("width").count).toBe(0);
      expect(geometry.getIndex()?.count ?? 0).toBe(0);
    }
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
    expect(numericArray(geometry.getIndex() as THREE.BufferAttribute).every(Number.isFinite)).toBe(
      true,
    );
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
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }

    expect(distance.every(Number.isFinite)).toBe(true);
    expect(distance.every((value) => value >= 0)).toBe(true);
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

  it("writes finite non-negative width values", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { segments: 4, curveType: "polyline", width: -1 },
    );

    const widths = numericArray(geometry.getAttribute("width") as THREE.BufferAttribute);
    expect(widths.every(Number.isFinite)).toBe(true);
    expect(widths.every((value) => value >= 0)).toBe(true);
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

  it("keeps widthCallback as a backwards-compatible width profile", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      {
        segments: 4,
        curveType: "polyline",
        width: 0.5,
        widthCallback: (t) => 0.5 + t,
      },
    );

    const widths = numericArray(geometry.getAttribute("width") as THREE.BufferAttribute);
    expect(widths[0]).toBeCloseTo(0.25);
    expect(widths[widths.length - 1]).toBeCloseTo(0.75);
  });

  it("prefers customWidthProfile over widthCallback when both are provided", () => {
    const geometry = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      {
        segments: 4,
        curveType: "polyline",
        width: 1,
        widthCallback: () => 2,
        customWidthProfile: () => 0.25,
      },
    );

    const widths = numericArray(geometry.getAttribute("width") as THREE.BufferAttribute);
    expect(new Set(widths)).toEqual(new Set([0.25]));
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

  it("does not duplicate a final point equal to the first point for closed paths", () => {
    const withoutDuplicate = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { segments: 9, closed: true, curveType: "polyline" },
    );
    const withDuplicate = buildRibbonGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 0, 0],
      ],
      { segments: 9, closed: true, curveType: "polyline" },
    );

    expect(withDuplicate.getAttribute("position").count).toBe(
      withoutDuplicate.getAttribute("position").count,
    );
    expect(withDuplicate.getIndex()?.count).toBe(withoutDuplicate.getIndex()?.count);
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

describe("buildTubePathGeometry", () => {
  it("returns empty geometry for invalid paths", () => {
    const geometries = [
      buildTubePathGeometry([], { segments: 4 }),
      buildTubePathGeometry([[0, 0, 0]], { segments: 4 }),
      buildTubePathGeometry(
        [
          [Number.NaN, 0, 0],
          [Number.POSITIVE_INFINITY, 0, 0],
        ],
        { segments: 4 },
      ),
    ];

    for (const geometry of geometries) {
      expect(geometry.getAttribute("position")).toBeUndefined();
      expect(geometry.getIndex()).toBeNull();
    }
  });

  it("returns valid TubeGeometry-like geometry for valid paths", () => {
    const geometry = buildTubePathGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { segments: 6, curveType: "polyline", radius: 0.1, radialSegments: 6 },
    );

    expect(geometry).toBeInstanceOf(THREE.TubeGeometry);
    expect(geometry.getAttribute("position").count).toBe((6 + 1) * (6 + 1));
    expect(geometry.getAttribute("normal").count).toBe(geometry.getAttribute("position").count);
    expect(geometry.getAttribute("uv").count).toBe(geometry.getAttribute("position").count);
    expect(geometry.getIndex()?.count ?? 0).toBeGreaterThan(0);
  });

  it("respects radius and radialSegments normalization", () => {
    const geometry = buildTubePathGeometry(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { segments: 4, curveType: "polyline", radius: -1, radialSegments: 2.9 },
    ) as THREE.TubeGeometry;

    expect(geometry.parameters.radius).toBe(0.04);
    expect(geometry.parameters.radialSegments).toBe(3);
    expect(geometry.getAttribute("position").count).toBe((4 + 1) * (3 + 1));
  });

  it("does not produce NaN for valid paths", () => {
    const geometry = buildTubePathGeometry(
      [
        [0, 0, 0],
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ],
      { segments: 8, curveType: "catmullrom", radius: 0.05, radialSegments: 5 },
    );

    for (const attribute of numericAttributes(geometry)) {
      expect(numericArray(attribute).every(Number.isFinite)).toBe(true);
    }
    expect(numericArray(geometry.getIndex() as THREE.BufferAttribute).every(Number.isFinite)).toBe(
      true,
    );
  });
});
