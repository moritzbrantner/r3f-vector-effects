import * as React from "react";
import type * as THREE from "three";
import type { CalligraphyRibbonProps } from "../types";
import { clamp } from "../utils/math";
import { InternalVectorPath3D } from "./VectorPath3D";

export const CalligraphyRibbon = React.forwardRef<THREE.Mesh, CalligraphyRibbonProps>(
  function CalligraphyRibbon(
    {
      points,
      color = "#ffffff",
      colorStart,
      colorEnd,
      opacity = 0.96,
      feather = 0.16,
      glow = 0,
      dash,
      depthTest = true,
      closed = false,
      segments = 96,
      curveType = "catmull-rom",
      width = 0.18,
      pressureProfile = "middle-heavy",
      customPressure,
      billboardMode = "none",
      renderOrder,
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
  ): React.JSX.Element {
    const pressure = React.useMemo(
      () => pressureFunction(pressureProfile, customPressure),
      [pressureProfile, customPressure],
    );

    return (
      <InternalVectorPath3D
        ref={forwardedRef}
        points={points}
        closed={closed}
        segments={segments}
        curveType={curveType}
        width={width}
        widthCallback={pressure}
        color={color}
        colorStart={colorStart}
        colorEnd={colorEnd}
        opacity={opacity}
        feather={feather}
        glow={glow}
        dash={dash}
        billboardMode={billboardMode}
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
      />
    );
  },
);

function pressureFunction(
  profile: CalligraphyRibbonProps["pressureProfile"],
  customPressure: CalligraphyRibbonProps["customPressure"],
): (t: number) => number {
  if (profile === "custom" && customPressure) {
    return (t) => clamp(customPressure(t), 0.02, 4);
  }

  if (profile === "start-end-taper") {
    return (t) => 0.1 + 0.9 * Math.sin(Math.PI * t);
  }

  if (profile === "sinusoidal") {
    return (t) => 0.65 + 0.35 * Math.sin(Math.PI * 4 * t);
  }

  return (t) => 0.2 + 0.8 * Math.sin(Math.PI * t) ** 0.6;
}
