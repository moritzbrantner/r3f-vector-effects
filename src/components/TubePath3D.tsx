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
    frustumCulled,
    visible,
    userData,
    name,
    position,
    rotation,
    scale,
    onPointerOver,
    onPointerOut,
    onClick,
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
  const internalMaterial = React.useMemo(() => new THREE.MeshBasicMaterial(), []);
  const meshMaterial = material ?? internalMaterial;

  React.useEffect(() => {
    internalMaterial.color.set(color);
    internalMaterial.opacity = normalizedOpacity;
    internalMaterial.transparent = normalizedOpacity < 1;
    internalMaterial.depthTest = depthTest;
    internalMaterial.needsUpdate = true;
  }, [internalMaterial, color, normalizedOpacity, depthTest]);

  React.useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  React.useEffect(() => {
    return () => {
      internalMaterial.dispose();
    };
  }, [internalMaterial]);

  const eventHandlers = { onPointerOver, onPointerOut, onClick };

  return (
    <mesh
      ref={forwardedRef}
      geometry={geometry}
      material={meshMaterial}
      renderOrder={renderOrder}
      frustumCulled={frustumCulled}
      visible={visible}
      userData={userData}
      name={name}
      position={position}
      rotation={rotation}
      scale={scale}
      {...eventHandlers}
    />
  );
});
