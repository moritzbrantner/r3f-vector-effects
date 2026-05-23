import { useFrame } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import type { MotionTrailProps, VectorEffectPoint } from "../types";
import { InternalVectorPath3D } from "./VectorPath3D";

const WORLD_POSITION = new THREE.Vector3();

export const MotionTrail = React.forwardRef<THREE.Mesh, MotionTrailProps>(function MotionTrail(
  {
    targetRef,
    points,
    maxPoints = 80,
    width = 0.08,
    color = "#66ccff",
    colorStart,
    colorEnd,
    opacity = 0.95,
    feather = 0.3,
    glow = 0.7,
    decay = 1.8,
    updateEvery = 0.033,
    minDistance = 0.001,
    paused = false,
    depthTest = false,
    renderOrder = 20,
    visible,
    userData,
    name,
    frustumCulled,
    position,
    rotation,
    scale,
    onPointerOver,
    onPointerOut,
    onClick,
  },
  forwardedRef,
): React.JSX.Element | null {
  const pointsRef = React.useRef<THREE.Vector3[]>([]);
  const elapsedSinceUpdate = React.useRef(0);
  const [, forceVersion] = React.useReducer((value: number) => value + 1, 0);
  const normalizedMinDistance = Number.isFinite(minDistance) ? Math.max(0, minDistance) : 0.001;
  const minDistanceSquared = normalizedMinDistance * normalizedMinDistance;

  React.useEffect(() => {
    if (points) {
      pointsRef.current = points.map((point) =>
        point instanceof THREE.Vector3
          ? point.clone()
          : new THREE.Vector3(point[0], point[1], point[2]),
      );
      forceVersion();
    }
  }, [points]);

  useFrame((_, delta) => {
    if (paused || !targetRef?.current || points) {
      return;
    }

    elapsedSinceUpdate.current += delta;
    if (elapsedSinceUpdate.current < updateEvery) {
      return;
    }
    elapsedSinceUpdate.current = 0;

    targetRef.current.getWorldPosition(WORLD_POSITION);
    const trail = pointsRef.current;
    const last = trail.length > 0 ? trail[trail.length - 1] : undefined;

    if (!last || last.distanceToSquared(WORLD_POSITION) > minDistanceSquared) {
      trail.push(WORLD_POSITION.clone());
      while (trail.length > maxPoints) {
        trail.shift();
      }
      forceVersion();
    }
  });

  const renderPoints: VectorEffectPoint[] = pointsRef.current;
  if (renderPoints.length < 2) {
    return null;
  }

  return (
    <InternalVectorPath3D
      ref={forwardedRef}
      points={renderPoints}
      segments={Math.max(2, Math.min(maxPoints * 2, 128))}
      curveType="polyline"
      width={width}
      widthProfile="taper"
      color={color}
      colorStart={colorStart}
      colorEnd={colorEnd}
      opacity={opacity}
      feather={feather}
      glow={glow}
      fade={decay}
      depthTest={depthTest}
      renderOrder={renderOrder}
      visible={visible}
      userData={userData}
      name={name}
      frustumCulled={frustumCulled}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
      additive
    />
  );
});
