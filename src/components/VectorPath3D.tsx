import { useFrame } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { normalizeRibbonStyle, normalizeSamplingOptions } from "../core/normalize";
import { buildRibbonGeometry } from "../geometry/buildRibbonGeometry";
import {
  createFeatheredRibbonMaterial,
  updateMaterialUniforms,
} from "../materials/createFeatheredRibbonMaterial";
import type { VectorPath3DProps } from "../types";

type VectorPathGeometryProps = Pick<
  VectorPath3DProps,
  | "points"
  | "closed"
  | "segments"
  | "curveType"
  | "width"
  | "widthProfile"
  | "widthCallback"
  | "customWidthProfile"
  | "dash"
>;

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
      curveType = "catmull-rom",
      width = 0.1,
      widthProfile = "constant",
      widthCallback,
      customWidthProfile,
      color = "#ffffff",
      colorStart,
      colorEnd,
      opacity = 1,
      feather = 0.08,
      glow = 0,
      dash,
      billboardMode = "none",
      depthTest = true,
      depthWrite = false,
      renderOrder,
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
      return createVectorPathGeometry({
        points,
        closed,
        segments,
        curveType,
        width,
        widthProfile,
        widthCallback,
        customWidthProfile,
        dash,
      });
    }, [
      points,
      closed,
      segments,
      curveType,
      width,
      widthProfile,
      widthCallback,
      customWidthProfile,
      dash,
    ]);

    const material = React.useMemo(() => createFeatheredRibbonMaterial(), []);

    React.useEffect(() => {
      updateMaterialUniforms(material, {
        color,
        colorStart,
        colorEnd,
        opacity,
        feather,
        glow,
        dash,
        depthTest,
        depthWrite,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        fade,
        animated,
        pulseSpeed,
      });
    }, [
      material,
      color,
      colorStart,
      colorEnd,
      opacity,
      feather,
      glow,
      dash,
      depthTest,
      depthWrite,
      fade,
      animated,
      pulseSpeed,
      additive,
    ]);

    React.useEffect(() => {
      return () => {
        geometry.dispose();
      };
    }, [geometry]);

    React.useEffect(() => {
      return () => {
        material.dispose();
      };
    }, [material]);

    useFrame(({ camera, clock }) => {
      if (billboardMode === "object" && meshRef.current) {
        meshRef.current.quaternion.copy(camera.quaternion);
      }

      if (animated) {
        material.uniforms.time.value = clock.elapsedTime;
      }
    });

    const eventHandlers = { onPointerOver, onPointerOut, onClick };

    return (
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
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
  },
);

export const VectorPath3D = React.forwardRef<THREE.Mesh, VectorPath3DProps>(
  function VectorPath3D(props, forwardedRef) {
    return <InternalVectorPath3D {...props} ref={forwardedRef} />;
  },
);

export function createVectorPathGeometry({
  points,
  closed,
  segments,
  curveType,
  width,
  widthProfile,
  widthCallback,
  customWidthProfile,
  dash,
}: VectorPathGeometryProps): THREE.BufferGeometry {
  const sampling = normalizeSamplingOptions({ closed, segments, curveType });
  const style = normalizeRibbonStyle({
    width,
    widthProfile,
    widthCallback,
    customWidthProfile,
    dash,
  });
  return buildRibbonGeometry(points, { ...sampling, ...style });
}
