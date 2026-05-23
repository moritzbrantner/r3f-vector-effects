export const ribbonVertexShader = /* glsl */ `
  attribute float pathProgress;
  attribute float pathDistance;
  attribute float side;

  varying vec2 vUv;
  varying float vProgress;
  varying float vPathDistance;
  varying float vSide;

  void main() {
    vUv = uv;
    vProgress = pathProgress;
    vPathDistance = pathDistance;
    vSide = side;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
