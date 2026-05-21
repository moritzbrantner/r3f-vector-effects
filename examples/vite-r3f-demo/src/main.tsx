import {
  CalligraphyRibbon,
  FeatheredPlane,
  MotionTrail,
  NeonCurve,
  VectorPath3D,
} from "@moritzbrantner/r3f-vector-effects";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as React from "react";
import { createRoot } from "react-dom/client";
import type * as THREE from "three";
import "./styles.css";

const VECTOR_POINTS: Array<[number, number, number]> = [
  [-2.8, 0.2, 0],
  [-1.4, 1.1, -0.25],
  [0, -0.85, 0.15],
  [1.4, 1.0, -0.2],
  [2.8, 0.1, 0],
];

const CALLIGRAPHY_POINTS: Array<[number, number, number]> = [
  [-2.2, -1.1, 0.4],
  [-0.8, -0.45, 0],
  [0.7, -1.35, -0.35],
  [2.2, -0.7, 0.1],
];

function MovingTarget(): React.JSX.Element {
  const ref = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }

    const time = clock.elapsedTime;
    ref.current.position.set(
      Math.sin(time) * 1.3,
      1.2 + Math.cos(time * 1.7) * 0.3,
      Math.cos(time) * 0.7,
    );
  });

  return (
    <>
      <mesh ref={ref}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <MotionTrail targetRef={ref} color="#ff5c8a" width={0.1} maxPoints={96} decay={1.6} />
    </>
  );
}

function Scene(): React.JSX.Element {
  const [width, setWidth] = React.useState(0.12);
  const [feather, setFeather] = React.useState(0.12);
  const [glow, setGlow] = React.useState(0.55);
  const [dashed, setDashed] = React.useState(true);
  const [colorStart, setColorStart] = React.useState("#66ccff");
  const [colorEnd, setColorEnd] = React.useState("#f8ff7a");

  return (
    <div className="app-shell">
      <Canvas camera={{ position: [0, 1.2, 6], fov: 48 }} dpr={[1, 2]}>
        <color attach="background" args={["#080b12"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[2, 3, 4]} intensity={1.5} color="#99d6ff" />
        <OrbitControls makeDefault />

        <group position={[0, 0.15, 0]}>
          <FeatheredPlane
            width={5.8}
            height={2.4}
            color="#101826"
            opacity={0.55}
            feather={0.12}
            radius={0.12}
            depthTest={false}
          />
          <VectorPath3D
            points={VECTOR_POINTS}
            width={width}
            colorStart={colorStart}
            colorEnd={colorEnd}
            feather={feather}
            glow={glow}
            dashed={dashed}
            dashSize={0.12}
            gapSize={0.06}
            depthTest={false}
            renderOrder={5}
          />
          <NeonCurve
            points={[
              [-2.4, 0.65, -0.3],
              [-1.1, 1.45, 0.25],
              [0.4, 0.85, -0.2],
              [2.4, 1.35, 0.1],
            ]}
            color="#48f4d6"
            coreWidth={0.035}
            glowWidth={0.28}
            intensity={2}
            animated
            pulseSpeed={2.2}
          />
          <CalligraphyRibbon
            points={CALLIGRAPHY_POINTS}
            color="#fff3c4"
            width={0.22}
            pressureProfile="middle-heavy"
          />
          <MovingTarget />
        </group>

        <gridHelper args={[8, 16, "#263346", "#151d2b"]} position={[0, -1.65, 0]} />
      </Canvas>

      <section className="controls">
        <label>
          <span>Width</span>
          <input
            type="range"
            min="0.03"
            max="0.35"
            step="0.01"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>
        <label>
          <span>Feather</span>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={feather}
            onChange={(event) => setFeather(Number(event.target.value))}
          />
        </label>
        <label>
          <span>Glow</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={glow}
            onChange={(event) => setGlow(Number(event.target.value))}
          />
        </label>
        <label className="inline-control">
          <input
            type="checkbox"
            checked={dashed}
            onChange={(event) => setDashed(event.target.checked)}
          />
          <span>Dashed</span>
        </label>
        <label>
          <span>Start</span>
          <input
            type="color"
            value={colorStart}
            onChange={(event) => setColorStart(event.target.value)}
          />
        </label>
        <label>
          <span>End</span>
          <input
            type="color"
            value={colorEnd}
            onChange={(event) => setColorEnd(event.target.value)}
          />
        </label>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Scene />
  </React.StrictMode>,
);
