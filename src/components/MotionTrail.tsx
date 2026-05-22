import { useFrame } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import type { MotionTrailProps, VectorEffectPoint } from "../types";
import { InternalVectorPath3D } from "./VectorPath3D";

const WORLD_POSITION = new THREE.Vector3();

export function MotionTrail({
  targetRef,
  points,
  maxPoints = 80,
  width = 0.08,
  color = "#66ccff",
  decay = 1.8,
  updateEvery = 0.033,
}: MotionTrailProps): React.JSX.Element | null {
  const pointsRef = React.useRef<THREE.Vector3[]>([]);
  const elapsedSinceUpdate = React.useRef(0);
  const [, forceVersion] = React.useReducer((value: number) => value + 1, 0);

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
    if (!targetRef?.current || points) {
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

    if (!last || last.distanceToSquared(WORLD_POSITION) > 1e-6) {
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
      points={renderPoints}
      segments={Math.max(2, Math.min(maxPoints * 2, 128))}
      curveType="polyline"
      width={width}
      widthProfile="taper"
      color={color}
      opacity={0.95}
      feather={0.3}
      glow={0.7}
      fade={decay}
      depthTest={false}
      renderOrder={20}
      additive
    />
  );
}
