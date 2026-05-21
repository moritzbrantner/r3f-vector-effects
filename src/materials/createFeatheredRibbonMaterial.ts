import * as THREE from "three";
import { cloneColor } from "../utils/color";

export interface FeatheredRibbonMaterialOptions {
  color?: THREE.ColorRepresentation;
  colorStart?: THREE.ColorRepresentation;
  colorEnd?: THREE.ColorRepresentation;
  opacity?: number;
  feather?: number;
  glow?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
  depthTest?: boolean;
  fade?: number;
  animated?: boolean;
  pulseSpeed?: number;
  blending?: THREE.Blending;
}

export function createFeatheredRibbonMaterial(
  options: FeatheredRibbonMaterialOptions = {},
): THREE.ShaderMaterial {
  const colorStart = cloneColor(options.colorStart ?? options.color ?? "#ffffff");
  const colorEnd = cloneColor(options.colorEnd ?? options.color ?? "#ffffff");

  return new THREE.ShaderMaterial({
    name: "R3FVectorEffectsFeatheredRibbonMaterial",
    transparent: true,
    depthWrite: false,
    depthTest: options.depthTest ?? true,
    blending: options.blending ?? THREE.NormalBlending,
    uniforms: {
      colorStart: { value: colorStart },
      colorEnd: { value: colorEnd },
      opacity: { value: options.opacity ?? 1 },
      feather: { value: options.feather ?? 0.08 },
      glow: { value: options.glow ?? 0 },
      dashed: { value: options.dashed ? 1 : 0 },
      dashSize: { value: options.dashSize ?? 0.12 },
      gapSize: { value: options.gapSize ?? 0.08 },
      fade: { value: options.fade ?? 0 },
      time: { value: 0 },
      animated: { value: options.animated ? 1 : 0 },
      pulseSpeed: { value: options.pulseSpeed ?? 1 },
    },
    vertexShader: /* glsl */ `
      attribute float pathProgress;
      attribute float side;

      varying vec2 vUv;
      varying float vProgress;
      varying float vSide;

      void main() {
        vUv = uv;
        vProgress = pathProgress;
        vSide = side;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 colorStart;
      uniform vec3 colorEnd;
      uniform float opacity;
      uniform float feather;
      uniform float glow;
      uniform float dashed;
      uniform float dashSize;
      uniform float gapSize;
      uniform float fade;
      uniform float time;
      uniform float animated;
      uniform float pulseSpeed;

      varying vec2 vUv;
      varying float vProgress;

      void main() {
        vec3 color = mix(colorStart, colorEnd, clamp(vProgress, 0.0, 1.0));

        // v is 0 at one ribbon edge, 1 at the other, and 0.5 in the center.
        float edgeDistance = 1.0 - abs(vUv.y * 2.0 - 1.0);
        float edgeAlpha = feather <= 0.0001
          ? 1.0
          : smoothstep(0.0, clamp(feather, 0.0001, 1.0), edgeDistance);

        if (glow > 0.0) {
          float glowCurve = pow(max(edgeDistance, 0.0), 1.0 / (1.0 + glow * 3.0));
          edgeAlpha = max(edgeAlpha, glowCurve * 0.75);
        }

        float dashAlpha = 1.0;
        if (dashed > 0.5) {
          float cycle = max(dashSize + gapSize, 0.0001);
          float localProgress = mod(vProgress, cycle);
          dashAlpha = step(localProgress, dashSize);
        }

        float fadeAlpha = fade <= 0.0 ? 1.0 : pow(clamp(vProgress, 0.0, 1.0), fade);
        float pulse = animated > 0.5
          ? 0.85 + 0.15 * sin(time * pulseSpeed + vProgress * 6.28318530718)
          : 1.0;
        float alpha = opacity * edgeAlpha * dashAlpha * fadeAlpha * pulse;

        if (alpha <= 0.001) {
          discard;
        }

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}
