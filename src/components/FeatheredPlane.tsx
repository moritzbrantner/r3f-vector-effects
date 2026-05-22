import * as React from "react";
import * as THREE from "three";
import { normalizeFeatheredPlaneOptions } from "../core/normalize";
import { featheredPlaneFragmentShader } from "../materials/shaders/featheredPlaneFragment.glsl";
import { featheredPlaneVertexShader } from "../materials/shaders/featheredPlaneVertex.glsl";
import type { FeatheredPlaneProps } from "../types";
import { cloneColor } from "../utils/color";

export function FeatheredPlane(props: FeatheredPlaneProps): React.JSX.Element {
  const { width, height, color, opacity, feather, radius, depthTest } =
    normalizeFeatheredPlaneOptions(props);
  const geometry = React.useMemo(
    () => new THREE.PlaneGeometry(width, height, 1, 1),
    [width, height],
  );
  const material = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: "R3FVectorEffectsFeatheredPlaneMaterial",
        transparent: true,
        depthWrite: false,
        depthTest,
        uniforms: {
          color: { value: cloneColor(color) },
          opacity: { value: opacity },
          feather: { value: feather },
          radius: { value: radius },
        },
        vertexShader: featheredPlaneVertexShader,
        fragmentShader: featheredPlaneFragmentShader,
      }),
    [color, opacity, feather, radius, depthTest],
  );

  React.useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} />;
}
