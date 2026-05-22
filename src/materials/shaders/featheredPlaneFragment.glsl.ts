export const featheredPlaneFragmentShader = /* glsl */ `
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
`;
