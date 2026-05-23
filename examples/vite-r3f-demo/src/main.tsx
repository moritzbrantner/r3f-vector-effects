import {
  CalligraphyRibbon,
  FeatheredPlane,
  MotionTrail,
  NeonCurve,
  TubePath3D,
  VectorPath3D,
} from "@moritzbrantner/r3f-vector-effects";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as React from "react";
import { createRoot } from "react-dom/client";
import type * as THREE from "three";
import "./styles.css";

const controlLabelClass = "grid min-w-0 gap-1.5 text-xs font-semibold text-[#c9d8eb]";
const rangeInputClass = "w-full accent-[#66ccff]";
const colorInputClass = "h-8 w-full rounded-md border border-[#97bcff3d] bg-[#0d1420] p-0.5";

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
  const [dashUnits, setDashUnits] = React.useState<"progress" | "world">("progress");
  const [colorStart, setColorStart] = React.useState("#66ccff");
  const [colorEnd, setColorEnd] = React.useState("#f8ff7a");
  const dashSize = dashUnits === "world" ? 0.42 : 0.12;
  const dashGap = dashUnits === "world" ? 0.18 : 0.06;

  return (
    <div className="relative h-full w-full overflow-hidden">
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
            dash={{ enabled: dashed, units: dashUnits, size: dashSize, gap: dashGap }}
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
          <TubePath3D
            points={[
              [-2.6, -1.45, -0.35],
              [-1.2, -1.75, 0.3],
              [0.4, -1.45, -0.15],
              [2.4, -1.75, 0.25],
            ]}
            radius={0.035}
            radialSegments={10}
            color="#8cff9a"
            opacity={0.85}
            depthTest={false}
            renderOrder={8}
          />
          <MovingTarget />
        </group>

        <gridHelper args={[8, 16, "#263346", "#151d2b"]} position={[0, -1.65, 0]} />
      </Canvas>

      <section className="absolute right-4 bottom-4 grid w-[min(420px,calc(100%_-_32px))] grid-cols-2 gap-3 rounded-lg border border-[#97bcff38] bg-[#080d16c7] p-3.5 text-[#c9d8eb] shadow-[0_16px_50px_rgb(0_0_0_/_32%)] backdrop-blur-md max-[560px]:right-3 max-[560px]:bottom-3 max-[560px]:left-3 max-[560px]:w-auto max-[560px]:grid-cols-1">
        <label className={controlLabelClass}>
          <span>Width</span>
          <input
            className={rangeInputClass}
            type="range"
            min="0.03"
            max="0.35"
            step="0.01"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>
        <label className={controlLabelClass}>
          <span>Feather</span>
          <input
            className={rangeInputClass}
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={feather}
            onChange={(event) => setFeather(Number(event.target.value))}
          />
        </label>
        <label className={controlLabelClass}>
          <span>Glow</span>
          <input
            className={rangeInputClass}
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={glow}
            onChange={(event) => setGlow(Number(event.target.value))}
          />
        </label>
        <label className={`${controlLabelClass} grid-cols-[auto_1fr] items-center self-end`}>
          <input
            className="h-4 w-4 accent-[#66ccff]"
            type="checkbox"
            checked={dashed}
            onChange={(event) => setDashed(event.target.checked)}
          />
          <span>Dashed</span>
        </label>
        <label className={controlLabelClass}>
          <span>Dash Units</span>
          <select
            className="h-8 rounded-md border border-[#97bcff3d] bg-[#0d1420] px-2 text-[#eef5ff]"
            value={dashUnits}
            onChange={(event) => setDashUnits(event.target.value as "progress" | "world")}
          >
            <option value="progress">Progress</option>
            <option value="world">World</option>
          </select>
        </label>
        <label className={controlLabelClass}>
          <span>Start</span>
          <input
            className={colorInputClass}
            type="color"
            value={colorStart}
            onChange={(event) => setColorStart(event.target.value)}
          />
        </label>
        <label className={controlLabelClass}>
          <span>End</span>
          <input
            className={colorInputClass}
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
