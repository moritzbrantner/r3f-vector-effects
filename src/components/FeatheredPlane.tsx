import * as React from "react";
import * as THREE from "three";
import { normalizeFeatheredPlaneOptions } from "../core/normalize";
import { featheredPlaneFragmentShader } from "../materials/shaders/featheredPlaneFragment.glsl";
import { featheredPlaneVertexShader } from "../materials/shaders/featheredPlaneVertex.glsl";
import type { FeatheredPlaneProps } from "../types";
import { cloneColor } from "../utils/color";

export const FeatheredPlane = React.forwardRef<THREE.Mesh, FeatheredPlaneProps>(
  function FeatheredPlane(
    {
      depthWrite = false,
      renderOrder,
      side = THREE.FrontSide,
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
      ...props
    },
    forwardedRef,
  ): React.JSX.Element {
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
          depthTest: true,
          side: THREE.FrontSide,
          uniforms: {
            color: { value: new THREE.Color("#111827") },
            opacity: { value: 0.75 },
            feather: { value: 0.08 },
            radius: { value: 0 },
          },
          vertexShader: featheredPlaneVertexShader,
          fragmentShader: featheredPlaneFragmentShader,
        }),
      [],
    );

    React.useEffect(() => {
      material.uniforms.color.value.copy(cloneColor(color));
      material.uniforms.opacity.value = opacity;
      material.uniforms.feather.value = feather;
      material.uniforms.radius.value = radius;
      material.depthTest = depthTest;
      material.depthWrite = depthWrite;
      material.side = side;
      material.needsUpdate = true;
    }, [material, color, opacity, feather, radius, depthTest, depthWrite, side]);

    React.useEffect(() => {
      return () => {
        geometry.dispose();
        material.dispose();
      };
    }, [geometry, material]);

    const eventHandlers = { onPointerOver, onPointerOut, onClick };

    return (
      <mesh
        ref={forwardedRef}
        geometry={geometry}
        material={material}
        renderOrder={renderOrder}
        visible={visible}
        userData={userData}
        name={name}
        frustumCulled={frustumCulled}
        position={position}
        rotation={rotation}
        scale={scale}
        {...eventHandlers}
      />
    );
  },
);
