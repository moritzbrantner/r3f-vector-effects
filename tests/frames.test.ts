import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { buildStableFrames } from "../src/geometry/frames";

function expectFiniteVector(vector: THREE.Vector3): void {
  expect(Number.isFinite(vector.x)).toBe(true);
  expect(Number.isFinite(vector.y)).toBe(true);
  expect(Number.isFinite(vector.z)).toBe(true);
}

describe("buildStableFrames", () => {
  it("returns one finite orthonormal frame per tangent", () => {
    const tangents = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(0, 1, 1),
      new THREE.Vector3(-1, 0.5, 0.25),
    ];

    const frames = buildStableFrames(tangents);

    expect(frames).toHaveLength(tangents.length);
    for (const frame of frames) {
      expectFiniteVector(frame.tangent);
      expectFiniteVector(frame.normal);
      expectFiniteVector(frame.side);
      expect(frame.tangent.length()).toBeCloseTo(1);
      expect(frame.normal.length()).toBeCloseTo(1);
      expect(frame.side.length()).toBeCloseTo(1);
      expect(Math.abs(frame.normal.dot(frame.tangent))).toBeLessThan(1e-6);
      expect(Math.abs(frame.side.dot(frame.tangent))).toBeLessThan(1e-6);
      expect(Math.abs(frame.side.dot(frame.normal))).toBeLessThan(1e-6);
    }
  });

  it("keeps billboard normals close to the requested up vector when possible", () => {
    const up = new THREE.Vector3(0, 0, 1);
    const frames = buildStableFrames(
      [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 1, 0)],
      { billboard: true, up },
    );

    for (const frame of frames) {
      expect(frame.normal.dot(up)).toBeGreaterThan(0.999);
      expect(Math.abs(frame.normal.dot(frame.tangent))).toBeLessThan(1e-6);
    }
  });

  it("handles zero-length tangents gracefully", () => {
    const frames = buildStableFrames([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
    ]);

    expect(frames).toHaveLength(3);
    for (const frame of frames) {
      expectFiniteVector(frame.tangent);
      expectFiniteVector(frame.normal);
      expectFiniteVector(frame.side);
      expect(frame.tangent.length()).toBeCloseTo(1);
      expect(frame.normal.length()).toBeCloseTo(1);
      expect(frame.side.length()).toBeCloseTo(1);
      expect(Math.abs(frame.normal.dot(frame.tangent))).toBeLessThan(1e-6);
      expect(Math.abs(frame.side.dot(frame.tangent))).toBeLessThan(1e-6);
    }
  });
});
