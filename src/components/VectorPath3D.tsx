import { useFrame } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { normalizeRibbonStyle, normalizeSamplingOptions } from "../core/normalize";
import { buildRibbonGeometry } from "../geometry/buildRibbonGeometry";
import { createFeatheredRibbonMaterial } from "../materials/createFeatheredRibbonMaterial";
import type { VectorPath3DProps } from "../types";

interface InternalVectorPath3DProps extends VectorPath3DProps {
  fade?: number;
  animated?: boolean;
  pulseSpeed?: number;
  additive?: boolean;
}

export const InternalVectorPath3D = React.forwardRef<THREE.Mesh, InternalVectorPath3DProps>(
  function VectorPath3D(
    {
      points,
      closed = false,
      segments = 64,
      curveType = "catmullrom",
      width = 0.1,
      widthProfile = "constant",
      color = "#ffffff",
      colorStart,
      colorEnd,
      opacity = 1,
      feather = 0.08,
      glow = 0,
      dash,
      billboardMode = "none",
      depthTest = true,
      renderOrder,
      fade = 0,
      animated = false,
      pulseSpeed = 1,
      additive = false,
    },
    forwardedRef,
  ) {
    const meshRef = React.useRef<THREE.Mesh>(null);

    React.useImperativeHandle(forwardedRef, () => meshRef.current as THREE.Mesh);

    const geometry = React.useMemo(() => {
      const sampling = normalizeSamplingOptions({ closed, segments, curveType });
      const style = normalizeRibbonStyle({ width, widthProfile, dash });
      return buildRibbonGeometry(points, { ...sampling, ...style });
    }, [points, closed, segments, curveType, width, widthProfile, dash]);

    const material = React.useMemo(() => {
      const style = normalizeRibbonStyle({
        color,
        colorStart,
        colorEnd,
        opacity,
        feather,
        glow,
        dash,
        depthTest,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });

      return createFeatheredRibbonMaterial({
        ...style,
        fade,
        animated,
        pulseSpeed,
      });
    }, [
      color,
      colorStart,
      colorEnd,
      opacity,
      feather,
      glow,
      dash,
      depthTest,
      fade,
      animated,
      pulseSpeed,
      additive,
    ]);

    React.useEffect(() => {
      return () => {
        geometry.dispose();
        material.dispose();
      };
    }, [geometry, material]);

    useFrame(({ camera, clock }) => {
      if (billboardMode === "object" && meshRef.current) {
        meshRef.current.quaternion.copy(camera.quaternion);
      }

      if (animated) {
        material.uniforms.time.value = clock.elapsedTime;
      }
    });

    return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={renderOrder} />;
  },
);

export const VectorPath3D = React.forwardRef<THREE.Mesh, VectorPath3DProps>(
  function VectorPath3D(props, forwardedRef) {
    return <InternalVectorPath3D {...props} ref={forwardedRef} />;
  },
);
