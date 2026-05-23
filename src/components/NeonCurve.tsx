import * as React from "react";
import * as THREE from "three";
import type { DashStyle, NeonCurveProps } from "../types";
import { InternalVectorPath3D } from "./VectorPath3D";

export const NeonCurve = React.forwardRef<THREE.Group, NeonCurveProps>(function NeonCurve(
  {
    points,
    color = "#66ccff",
    coreColor,
    glowColor,
    closed = false,
    segments = 64,
    curveType = "catmull-rom",
    coreWidth = 0.04,
    glowWidth = 0.3,
    intensity = 1.6,
    opacity,
    glowOpacity,
    dashed = false,
    dashSize,
    gapSize,
    dashPhase,
    dashUnits = "progress",
    depthTest = false,
    renderOrder = 10,
    visible,
    userData,
    name,
    frustumCulled,
    position,
    rotation,
    scale,
    pulseSpeed = 1.5,
    animated = false,
  },
  forwardedRef,
): React.JSX.Element {
  const resolvedCoreColor = coreColor ?? color;
  const resolvedGlowColor = glowColor ?? color;
  const coreOpacity = opacity ?? Math.min(1, 0.75 + intensity * 0.15);
  const resolvedGlowOpacity = glowOpacity ?? Math.min(0.85, 0.18 + intensity * 0.18);
  const coreColorStart = React.useMemo(
    () => new THREE.Color(resolvedCoreColor).multiplyScalar(Math.max(1, intensity * 0.6)),
    [resolvedCoreColor, intensity],
  );
  const dash = React.useMemo<DashStyle | undefined>(() => {
    if (!dashed) {
      return undefined;
    }

    return {
      enabled: true,
      size: dashSize,
      gap: gapSize,
      phase: dashPhase,
      units: dashUnits,
    };
  }, [dashed, dashSize, gapSize, dashPhase, dashUnits]);

  return (
    <group
      ref={forwardedRef}
      visible={visible}
      userData={userData}
      name={name}
      frustumCulled={frustumCulled}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <InternalVectorPath3D
        points={points}
        closed={closed}
        segments={segments}
        curveType={curveType}
        width={glowWidth}
        color={resolvedGlowColor}
        opacity={resolvedGlowOpacity}
        feather={0.55}
        glow={intensity}
        dash={dash}
        depthTest={depthTest}
        renderOrder={renderOrder}
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
        colorStart={coreColorStart}
        colorEnd={resolvedCoreColor}
        opacity={coreOpacity}
        feather={0.08}
        dash={dash}
        depthTest={depthTest}
        renderOrder={renderOrder + 1}
        animated={animated}
        pulseSpeed={pulseSpeed}
        additive
      />
    </group>
  );
});
