import * as React from "react";
import * as THREE from "three";
import type { FeatheredPlaneProps } from "../types";
import { cloneColor } from "../utils/color";

export function FeatheredPlane({
  width,
  height,
  color = "#111827",
  opacity = 0.75,
  feather = 0.08,
  radius = 0,
  depthTest = true,
}: FeatheredPlaneProps): React.JSX.Element {
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
        vertexShader: /* glsl */ `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 color;
          uniform float opacity;
          uniform float feather;
          uniform float radius;

          varying vec2 vUv;

          void main() {
            vec2 centered = abs(vUv - 0.5);
            vec2 edge = 0.5 - centered;
            float edgeDistance = min(edge.x, edge.y) * 2.0;
            float alpha = feather <= 0.0001
              ? opacity
              : opacity * smoothstep(0.0, clamp(feather, 0.0001, 1.0), edgeDistance);

            if (radius > 0.0) {
              vec2 corner = max(centered - vec2(0.5 - radius), 0.0);
              float cornerDistance = length(corner) / max(radius, 0.0001);
              alpha *= 1.0 - smoothstep(0.95, 1.0, cornerDistance);
            }

            if (alpha <= 0.001) {
              discard;
            }

            gl_FragColor = vec4(color, alpha);
          }
        `,
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
