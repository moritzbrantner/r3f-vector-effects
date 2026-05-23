import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const root = process.cwd();
const require = createRequire(import.meta.url);

const entrypoints = [
  "@moritzbrantner/r3f-vector-effects",
  "@moritzbrantner/r3f-vector-effects/react",
  "@moritzbrantner/r3f-vector-effects/geometry",
  "@moritzbrantner/r3f-vector-effects/materials",
  "@moritzbrantner/r3f-vector-effects/experimental/tsl",
];

for (const entrypoint of entrypoints) {
  await import(entrypoint);
}

for (const entrypoint of entrypoints) {
  require(entrypoint);
}

const smokeDir = join(root, ".pack-smoke");
rmSync(smokeDir, { force: true, recursive: true });
mkdirSync(smokeDir, { recursive: true });

writeFileSync(
  join(smokeDir, "consumer.tsx"),
  `
    import * as THREE from "three";
    import {
      CalligraphyRibbon,
      FeatheredPlane,
      MotionTrail,
      NeonCurve,
      TubePath3D,
      VectorPath3D,
      buildRibbonGeometry,
      type DashStyle,
      type TubePath3DProps,
    } from "@moritzbrantner/r3f-vector-effects";
    import { VectorPath3D as VectorPath3DSubpath } from "@moritzbrantner/r3f-vector-effects/react";
    import { sampleCurve } from "@moritzbrantner/r3f-vector-effects/geometry";
    import { createFeatheredRibbonMaterial } from "@moritzbrantner/r3f-vector-effects/materials";
    import { createTslRibbonMaterial } from "@moritzbrantner/r3f-vector-effects/experimental/tsl";

    const points: TubePath3DProps["points"] = [[0, 0, 0], [1, 0, 0]];
    const dash: DashStyle = { enabled: true, units: "world", size: 0.25, gap: 0.1 };
    const material = new THREE.MeshBasicMaterial({ color: "white" });

    buildRibbonGeometry(points, { dash });
    sampleCurve(points);
    createFeatheredRibbonMaterial({ dash });
    createTslRibbonMaterial({ dash });

    export const scene = (
      <>
        <VectorPath3D points={points} dash={dash} customWidthProfile={(t) => 0.5 + t} />
        <VectorPath3DSubpath points={points} />
        <TubePath3D points={points} material={material} />
        <NeonCurve points={points} />
        <CalligraphyRibbon points={points} />
        <MotionTrail points={points} />
        <FeatheredPlane width={1} height={1} />
      </>
    );
  `,
);

writeFileSync(
  join(smokeDir, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        lib: ["DOM", "DOM.Iterable", "ES2020"],
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ["consumer.tsx"],
    },
    null,
    2,
  ),
);

execFileSync("bun", ["x", "tsc", "--project", join(smokeDir, "tsconfig.json")], {
  cwd: root,
  stdio: "inherit",
});
