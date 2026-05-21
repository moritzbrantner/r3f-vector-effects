import { describe, expect, it } from "vitest";
import { compactPoints, sampleCurve } from "../src/geometry/sampleCurve";

describe("sampleCurve", () => {
  it("compacts consecutive duplicate points", () => {
    const points = compactPoints([
      [0, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ]);

    expect(points).toHaveLength(2);
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
  });
});
