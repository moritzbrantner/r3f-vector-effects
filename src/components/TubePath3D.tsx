import * as React from "react";
import * as THREE from "three";
import { buildTubePathGeometry } from "../geometry/buildTubePathGeometry";
import type { TubePath3DProps } from "../types";
import { clamp, isFiniteNumber } from "../utils/math";

export const TubePath3D = React.forwardRef<THREE.Mesh, TubePath3DProps>(function TubePath3D(
  {
    points,
    closed = false,
    segments = 64,
    curveType = "catmull-rom",
    epsilon,
    radius = 0.04,
    radialSegments = 8,
    color = "#ffffff",
    opacity = 1,
    depthTest = true,
    renderOrder,
    material,
  },
  forwardedRef,
) {
  const geometry = React.useMemo(
    () =>
      buildTubePathGeometry(points, {
        closed,
        segments,
        curveType,
        epsilon,
        radius,
        radialSegments,
      }),
    [points, closed, segments, curveType, epsilon, radius, radialSegments],
  );
  const normalizedOpacity = clamp(isFiniteNumber(opacity) ? opacity : 1, 0, 1);
  const meshMaterial = React.useMemo(
    () =>
      material ??
      new THREE.MeshBasicMaterial({
        color,
        opacity: normalizedOpacity,
        transparent: normalizedOpacity < 1,
        depthTest,
      }),
    [material, color, normalizedOpacity, depthTest],
  );

  React.useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  React.useEffect(() => {
    if (material) {
      return undefined;
    }

    return () => {
      meshMaterial.dispose();
    };
  }, [meshMaterial, material]);

  return (
    <mesh
      ref={forwardedRef}
      geometry={geometry}
      material={meshMaterial}
      renderOrder={renderOrder}
    />
  );
});
