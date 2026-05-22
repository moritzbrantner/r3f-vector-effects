import type * as React from "react";
import * as THREE from "three";
import type { NeonCurveProps } from "../types";
import { InternalVectorPath3D } from "./VectorPath3D";

export function NeonCurve({
  points,
  color = "#66ccff",
  closed = false,
  segments = 64,
  curveType = "catmull-rom",
  coreWidth = 0.04,
  glowWidth = 0.3,
  intensity = 1.6,
  pulseSpeed = 1.5,
  animated = false,
}: NeonCurveProps): React.JSX.Element {
  const coreOpacity = Math.min(1, 0.75 + intensity * 0.15);
  const glowOpacity = Math.min(0.85, 0.18 + intensity * 0.18);

  return (
    <group>
      <InternalVectorPath3D
        points={points}
        closed={closed}
        segments={segments}
        curveType={curveType}
        width={glowWidth}
        color={color}
        opacity={glowOpacity}
        feather={0.55}
        glow={intensity}
        depthTest={false}
        renderOrder={10}
        animated={animated}
        pulseSpeed={pulseSpeed}
        additive
      />
      <InternalVectorPath3D
        points={points}
        closed={closed}
        segments={segments}
        curveType={curveType}
        width={coreWidth}
        colorStart={new THREE.Color(color).multiplyScalar(Math.max(1, intensity * 0.6))}
        colorEnd={color}
        opacity={coreOpacity}
        feather={0.08}
        depthTest={false}
        renderOrder={11}
        animated={animated}
        pulseSpeed={pulseSpeed}
        additive
      />
    </group>
  );
}
