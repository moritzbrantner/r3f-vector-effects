export const ribbonFragmentShader = /* glsl */ `
  uniform vec3 colorStart;
  uniform vec3 colorEnd;
  uniform float opacity;
  uniform float feather;
  uniform float glow;
  uniform float dashed;
  uniform float dashSize;
  uniform float gapSize;
  uniform float dashPhase;
  uniform float dashUnits;
  uniform float alphaTest;
  uniform float fade;
  uniform float time;
  uniform float animated;
  uniform float pulseSpeed;

  varying vec2 vUv;
  varying float vProgress;
  varying float vPathDistance;
  varying float vSide;

  void main() {
    float progress = clamp(vProgress, 0.0, 1.0);
    vec3 color = mix(colorStart, colorEnd, progress);

    // uv.y and side both run across the ribbon width; using both makes custom
    // geometries resilient as long as one attribute is present and normalized.
    float uvAcross = clamp(vUv.y, 0.0, 1.0);
    float sideAcross = clamp(vSide * 0.5 + 0.5, 0.0, 1.0);
    float uvEdgeDistance = 1.0 - abs(uvAcross * 2.0 - 1.0);
    float sideEdgeDistance = 1.0 - abs(sideAcross * 2.0 - 1.0);
    float edgeDistance = clamp(max(uvEdgeDistance, sideEdgeDistance), 0.0, 1.0);

    float safeFeather = clamp(feather, 0.0001, 1.0);
    float edgeAlpha = feather <= 0.0001
      ? 1.0
      : smoothstep(0.0, safeFeather, edgeDistance);

    if (glow > 0.0) {
      float safeGlow = max(glow, 0.0);
      float glowCurve = pow(max(edgeDistance, 0.0001), 1.0 / (1.0 + safeGlow * 3.0));
      edgeAlpha = max(edgeAlpha, glowCurve * clamp(safeGlow, 0.0, 1.5) * 0.5);
    }

    float dashAlpha = 1.0;
    if (dashed > 0.5) {
      float safeDashSize = max(dashSize, 0.0001);
      float safeGapSize = max(gapSize, 0.0001);
      float cycle = max(safeDashSize + safeGapSize, 0.0001);
      float dashCoordinate = dashUnits > 0.5 ? max(vPathDistance, 0.0) : progress;
      float localDash = mod(dashCoordinate + dashPhase, cycle);
      dashAlpha = 1.0 - step(safeDashSize, localDash);
    }

    float fadeAlpha = fade <= 0.0 ? 1.0 : pow(progress, max(fade, 0.0));
    float pulse = animated > 0.5
      ? 0.85 + 0.15 * sin(time * pulseSpeed + progress * 6.28318530718)
      : 1.0;
    float alpha = opacity * edgeAlpha * dashAlpha * fadeAlpha * pulse;

    if (alpha <= max(alphaTest, 0.0)) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
  }
`;
