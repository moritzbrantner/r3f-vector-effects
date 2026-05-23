import { describe, expect, it } from "vitest";
import { compactPoints, sampleCurve } from "../src/geometry/sampleCurve";

describe("sampleCurve", () => {
  it("returns empty samples for empty and single-point paths", () => {
    expect(sampleCurve([], { segments: 0 }).points).toHaveLength(0);
    expect(sampleCurve([[0, 0, 0]], { segments: 8 }).points).toHaveLength(0);
  });

  it("compacts consecutive duplicate points", () => {
    const points = compactPoints([
      [0, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ]);

    expect(points).toHaveLength(2);
  });

  it("uses epsilon when compacting nearly duplicate points", () => {
    const points = compactPoints(
      [
        [0, 0, 0],
        [0.001, 0, 0],
        [1, 0, 0],
      ],
      false,
      0.01,
    );

    expect(points).toHaveLength(2);
  });

  it("filters non-finite points before sampling", () => {
    const sampled = sampleCurve(
      [
        [0, 0, 0],
        [Number.NaN, 0, 0],
        [Number.POSITIVE_INFINITY, 0, 0],
        [1, 0, 0],
      ],
      { segments: 4, curveType: "polyline" },
    );

    expect(sampled.points).toHaveLength(5);
    expect(sampled.points.every((point) => Number.isFinite(point.x))).toBe(true);
  });

  it("samples open polylines with segments plus one points", () => {
    const sampled = sampleCurve(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { segments: 5, curveType: "polyline" },
    );

    expect(sampled.points).toHaveLength(6);
    expect(sampled.progress[0]).toBe(0);
    expect(sampled.progress[sampled.progress.length - 1]).toBe(1);
    expect(sampled.totalLength).toBeGreaterThan(0);
  });

  it("includes endpoints for open paths", () => {
    const sampled = sampleCurve(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      { segments: 4, curveType: "polyline" },
    );

    expect(sampled.points[0].toArray()).toEqual([0, 0, 0]);
    expect(sampled.points[sampled.points.length - 1].toArray()).toEqual([1, 1, 0]);
  });

  it("samples closed paths without duplicating the first point at the end", () => {
    const sampled = sampleCurve(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 0, 0],
      ],
      { segments: 12, curveType: "polyline", closed: true },
    );

    expect(sampled.points).toHaveLength(12);
    expect(sampled.progress[sampled.progress.length - 1]).toBeLessThan(1);
    expect(
      sampled.points[0].distanceToSquared(sampled.points[sampled.points.length - 1]),
    ).toBeGreaterThan(0);
  });

  it("supports catmullrom as a backwards-compatible curve type alias", () => {
    const hyphenated = sampleCurve(
      [
        [-1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
      ],
      { segments: 8, curveType: "catmull-rom" },
    );
    const alias = sampleCurve(
      [
        [-1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
      ],
      { segments: 8, curveType: "catmullrom" },
    );

    expect(alias.points).toHaveLength(hyphenated.points.length);
    expect(alias.totalLength).toBeCloseTo(hyphenated.totalLength);
    expect(alias.progress[alias.progress.length - 1]).toBe(1);
  });

  it("samples catmull-rom curves with stable normalized progress", () => {
    const sampled = sampleCurve(
      [
        [-1, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
      ],
      { segments: 10, curveType: "catmull-rom" },
    );

    expect(sampled.points).toHaveLength(11);
    expect(sampled.progress[0]).toBe(0);
    expect(sampled.progress[sampled.progress.length - 1]).toBe(1);

    for (const value of sampled.progress) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("returns monotonic distances and finite normalized progress", () => {
    const sampled = sampleCurve(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 2, 0],
        [3, 2, 0],
      ],
      { segments: 12, curveType: "polyline" },
    );

    for (const value of sampled.progress) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    for (let index = 1; index < sampled.distances.length; index += 1) {
      expect(sampled.distances[index]).toBeGreaterThanOrEqual(sampled.distances[index - 1]);
    }
  });

  it("computes a sensible total length for simple polylines", () => {
    const sampled = sampleCurve(
      [
        [0, 0, 0],
        [3, 0, 0],
        [3, 4, 0],
      ],
      { segments: 7, curveType: "polyline" },
    );

    expect(sampled.totalLength).toBeCloseTo(7);
    expect(sampled.distances[sampled.distances.length - 1]).toBeCloseTo(7);
  });

  it("normalizes very low and high segment counts", () => {
    const low = sampleCurve(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { segments: Number.NaN, curveType: "polyline" },
    );
    const high = sampleCurve(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      { segments: 1000.9, curveType: "polyline" },
    );

    expect(low.points).toHaveLength(65);
    expect(high.points).toHaveLength(1001);
    expect(high.progress[high.progress.length - 1]).toBe(1);
  });
});
