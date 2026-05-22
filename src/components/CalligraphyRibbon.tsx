import * as React from "react";
import * as THREE from "three";
import { buildRibbonGeometry } from "../geometry/buildRibbonGeometry";
import { createFeatheredRibbonMaterial } from "../materials/createFeatheredRibbonMaterial";
import type { CalligraphyRibbonProps } from "../types";
import { clamp } from "../utils/math";

export function CalligraphyRibbon({
  points,
  color = "#ffffff",
  closed = false,
  segments = 96,
  curveType = "catmull-rom",
  width = 0.18,
  pressureProfile = "middle-heavy",
  customPressure,
}: CalligraphyRibbonProps): React.JSX.Element {
  const pressure = React.useMemo(
    () => pressureFunction(pressureProfile, customPressure),
    [pressureProfile, customPressure],
  );

  const geometry = React.useMemo(
    () =>
      buildRibbonGeometry(points, {
        closed,
        segments,
        width,
        widthCallback: pressure,
        curveType,
      }),
    [points, closed, segments, curveType, width, pressure],
  );

  const material = React.useMemo(
    () =>
      createFeatheredRibbonMaterial({
        color,
        opacity: 0.96,
        feather: 0.16,
      }),
    [color],
  );

  React.useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} />;
}

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
