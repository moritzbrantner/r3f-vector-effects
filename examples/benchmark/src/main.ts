import {
  buildRibbonGeometry,
  createFeatheredRibbonMaterial,
} from "@moritzbrantner/r3f-vector-effects";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  abs,
  attribute,
  clamp,
  color,
  float,
  max,
  mix,
  mod,
  mul,
  oneMinus,
  pow,
  smoothstep,
  step,
  sub,
  uv,
} from "three/tsl";
import { MeshBasicNodeMaterial, WebGPURenderer } from "three/webgpu";
import "./styles.css";

type RendererMode = "webgl" | "webgpu";
type MaterialMode = "tsl" | "glsl";

interface BenchmarkSettings {
  renderer: RendererMode;
  material: MaterialMode;
  paths: number;
  segments: number;
  dpr: number;
  animate: boolean;
}

interface SceneStats {
  buildMs: number;
  triangles: number;
  vertices: number;
}

interface BenchmarkScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  materials: Array<THREE.Material & { uniforms?: { time?: { value: number } } }>;
  stats: SceneStats;
  dispose: () => void;
}

type BenchmarkRenderer = THREE.WebGLRenderer | WebGPURenderer;

const DEFAULT_SETTINGS: BenchmarkSettings = {
  renderer: "webgl",
  material: "glsl",
  paths: 400,
  segments: 48,
  dpr: 1,
  animate: true,
};

const PALETTE = [
  ["#63d2ff", "#fff06b"],
  ["#ff5c8a", "#7afcff"],
  ["#8cff9a", "#ffb05c"],
  ["#c49cff", "#70ffe3"],
  ["#ff8f6b", "#a7ff6b"],
] as const;

const viewport = getElement("viewport", HTMLDivElement);
const statusText = getElement("status", HTMLParagraphElement);
const form = getElement("controls", HTMLFormElement);
const rendererInput = form.elements.namedItem("renderer") as HTMLSelectElement;
const materialInput = form.elements.namedItem("material") as HTMLSelectElement;
const pathsInput = form.elements.namedItem("paths") as HTMLInputElement;
const segmentsInput = form.elements.namedItem("segments") as HTMLInputElement;
const dprInput = form.elements.namedItem("dpr") as HTMLInputElement;
const animateInput = form.elements.namedItem("animate") as HTMLInputElement;

const metricElements = {
  fps: getElement("fps", HTMLElement),
  frame: getElement("frame", HTMLElement),
  p95: getElement("p95", HTMLElement),
  calls: getElement("calls", HTMLElement),
  triangles: getElement("triangles", HTMLElement),
  build: getElement("build", HTMLElement),
  pathsValue: getElement("pathsValue", HTMLOutputElement),
  segmentsValue: getElement("segmentsValue", HTMLOutputElement),
  dprValue: getElement("dprValue", HTMLOutputElement),
};

let currentRun: (() => void) | undefined;

function readSettingsFromUrl(): BenchmarkSettings {
  const params = new URLSearchParams(window.location.search);
  const renderer = params.get("renderer") === "webgpu" ? "webgpu" : DEFAULT_SETTINGS.renderer;
  const material = params.get("material") === "glsl" ? "glsl" : DEFAULT_SETTINGS.material;

  return {
    renderer,
    material,
    paths: readNumber(params, "paths", DEFAULT_SETTINGS.paths, 25, 1600),
    segments: readNumber(params, "segments", DEFAULT_SETTINGS.segments, 8, 160),
    dpr: readNumber(params, "dpr", DEFAULT_SETTINGS.dpr, 0.5, 2),
    animate:
      params.get("animate") === null ? DEFAULT_SETTINGS.animate : params.get("animate") === "true",
  };
}

function writeSettingsToUrl(settings: BenchmarkSettings): void {
  const params = new URLSearchParams();
  params.set("renderer", settings.renderer);
  params.set("material", settings.material);
  params.set("paths", String(settings.paths));
  params.set("segments", String(settings.segments));
  params.set("dpr", String(settings.dpr));
  params.set("animate", String(settings.animate));
  window.history.replaceState(null, "", `?${params.toString()}`);
}

function applySettingsToControls(settings: BenchmarkSettings): void {
  rendererInput.value = settings.renderer;
  materialInput.value = settings.material;
  pathsInput.value = String(settings.paths);
  segmentsInput.value = String(settings.segments);
  dprInput.value = String(settings.dpr);
  animateInput.checked = settings.animate;
  updateControlOutputs(settings);
}

function readSettingsFromControls(): BenchmarkSettings {
  return {
    renderer: rendererInput.value as RendererMode,
    material: materialInput.value as MaterialMode,
    paths: Number(pathsInput.value),
    segments: Number(segmentsInput.value),
    dpr: Number(dprInput.value),
    animate: animateInput.checked,
  };
}

function normalizeSettings(settings: BenchmarkSettings): BenchmarkSettings {
  if (settings.renderer === "webgpu" && settings.material === "glsl") {
    return { ...settings, material: "tsl" };
  }

  if (settings.renderer === "webgl" && settings.material === "tsl") {
    return { ...settings, material: "glsl" };
  }

  return settings;
}

function updateControlOutputs(settings: BenchmarkSettings): void {
  metricElements.pathsValue.value = `${settings.paths}`;
  metricElements.segmentsValue.value = `${settings.segments}`;
  metricElements.dprValue.value = `${settings.dpr.toFixed(2)}x`;
}

async function start(settings: BenchmarkSettings): Promise<void> {
  currentRun?.();
  currentRun = undefined;
  viewport.textContent = "";

  const normalizedSettings = normalizeSettings(settings);
  applySettingsToControls(normalizedSettings);
  writeSettingsToUrl(normalizedSettings);
  statusText.textContent = "Preparing scene...";

  const canvas = document.createElement("canvas");
  viewport.append(canvas);

  try {
    const renderer = await createRenderer(canvas, normalizedSettings);
    const benchmarkScene = createBenchmarkScene(renderer, normalizedSettings);
    currentRun = runBenchmark(renderer, benchmarkScene, normalizedSettings, canvas);
  } catch (error) {
    canvas.remove();
    const message = error instanceof Error ? error.message : String(error);
    statusText.textContent = message;
    resetMetrics();
  }
}

async function createRenderer(
  canvas: HTMLCanvasElement,
  settings: BenchmarkSettings,
): Promise<BenchmarkRenderer> {
  if (settings.renderer === "webgpu") {
    await assertWebGpuAvailable();
    const renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      alpha: false,
    } as ConstructorParameters<typeof WebGPURenderer>[0] & { canvas: HTMLCanvasElement });
    renderer.setPixelRatio(settings.dpr);
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
    await renderer.init();
    return renderer;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(settings.dpr);
  renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
  return renderer;
}

async function assertWebGpuAvailable(): Promise<void> {
  const gpu = (
    navigator as Navigator & {
      gpu?: {
        requestAdapter: () => Promise<unknown>;
      };
    }
  ).gpu;

  if (!gpu) {
    throw new Error(
      "WebGPU is not available in this browser. Use WebGL or a WebGPU-enabled browser.",
    );
  }

  const adapter = await withTimeout(gpu.requestAdapter(), 4000);
  if (!adapter) {
    throw new Error("WebGPU is available, but no compatible adapter was found.");
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Timed out while requesting a WebGPU adapter."));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function createBenchmarkScene(
  renderer: BenchmarkRenderer,
  settings: BenchmarkSettings,
): BenchmarkScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#090d11");

  const camera = new THREE.PerspectiveCamera(
    46,
    viewport.clientWidth / viewport.clientHeight,
    0.1,
    500,
  );
  camera.position.set(0, 0, 42);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 12;
  controls.maxDistance = 120;

  const materials = createMaterials(settings);
  const group = new THREE.Group();
  const random = createRandom(42);
  const columns = Math.ceil(Math.sqrt(settings.paths));
  const rows = Math.ceil(settings.paths / columns);
  const cellSize = 1.15;
  const start = performance.now();
  let triangles = 0;
  let vertices = 0;

  for (let index = 0; index < settings.paths; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = (column - columns / 2) * cellSize;
    const y = (row - rows / 2) * cellSize;
    const points = createPathPoints(x, y, random);
    const geometry = buildRibbonGeometry(points, {
      segments: settings.segments,
      width: 0.17 + random() * 0.08,
      widthProfile: index % 3 === 0 ? "pulse" : "calligraphy",
    });
    const material = materials[index % materials.length];
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = random() * Math.PI * 2;
    group.add(mesh);

    vertices += geometry.getAttribute("position").count;
    triangles += geometry.index ? geometry.index.count / 3 : 0;
  }

  scene.add(group);

  const grid = new THREE.GridHelper(Math.max(columns, rows) * cellSize, 24, "#314255", "#18212b");
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -1.2;
  scene.add(grid);

  const stats = {
    buildMs: performance.now() - start,
    triangles,
    vertices,
  };

  return {
    scene,
    camera,
    controls,
    materials,
    stats,
    dispose: () => {
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
        }
      });
      for (const material of materials) {
        material.dispose();
      }
    },
  };
}

function createMaterials(settings: BenchmarkSettings): BenchmarkScene["materials"] {
  return PALETTE.map(([startColor, endColor], index) => {
    if (settings.material === "glsl") {
      return createFeatheredRibbonMaterial({
        colorStart: startColor,
        colorEnd: endColor,
        opacity: 0.86,
        feather: 0.22,
        glow: 0.45,
        dashed: index % 2 === 0,
        dashSize: 0.075,
        gapSize: 0.038,
        depthTest: false,
        animated: settings.animate,
        pulseSpeed: 1.8,
        blending: THREE.AdditiveBlending,
      });
    }

    return createTslRibbonMaterial({
      colorStart: startColor,
      colorEnd: endColor,
      opacity: 0.86,
      feather: 0.22,
      glow: 0.45,
      dashed: index % 2 === 0,
      dashSize: 0.075,
      gapSize: 0.038,
    });
  });
}

function createTslRibbonMaterial(options: {
  colorStart: string;
  colorEnd: string;
  opacity: number;
  feather: number;
  glow: number;
  dashed: boolean;
  dashSize: number;
  gapSize: number;
}): THREE.Material {
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const progress = clamp(attribute("pathProgress", "float"), 0, 1);
  const edgeDistance = oneMinus(abs(sub(mul(uv().y, 2), 1)));
  const edgeAlpha = smoothstep(0, Math.max(options.feather, 0.0001), edgeDistance);
  const glowAlpha = mul(
    pow(max(edgeDistance, 0), 1 / (1 + options.glow * 3)),
    options.glow > 0 ? 0.75 : 0,
  );
  const dashAlpha = options.dashed
    ? step(mod(progress, options.dashSize + options.gapSize), options.dashSize)
    : float(1);

  material.colorNode = mix(color(options.colorStart), color(options.colorEnd), progress);
  material.opacityNode = mul(max(edgeAlpha, glowAlpha), dashAlpha, options.opacity);
  return material;
}

function createPathPoints(
  x: number,
  y: number,
  random: () => number,
): Array<[number, number, number]> {
  const bend = 0.28 + random() * 0.55;
  const height = 0.28 + random() * 0.46;

  return [
    [x - 0.42, y + (random() - 0.5) * height, (random() - 0.5) * 0.6],
    [x - 0.18, y + bend * (random() > 0.5 ? 1 : -1), (random() - 0.5) * 0.6],
    [x + 0.05, y + (random() - 0.5) * height, (random() - 0.5) * 0.6],
    [x + 0.28, y - bend * (random() > 0.5 ? 1 : -1), (random() - 0.5) * 0.6],
    [x + 0.46, y + (random() - 0.5) * height, (random() - 0.5) * 0.6],
  ];
}

function runBenchmark(
  renderer: BenchmarkRenderer,
  benchmarkScene: BenchmarkScene,
  settings: BenchmarkSettings,
  canvas: HTMLCanvasElement,
): () => void {
  const frames: number[] = [];
  let previous = performance.now();
  let animationFrame = 0;
  let lastMetricsUpdate = 0;
  let disposed = false;

  const resize = () => {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    benchmarkScene.camera.aspect = width / height;
    benchmarkScene.camera.updateProjectionMatrix();
    renderer.setPixelRatio(settings.dpr);
    renderer.setSize(width, height, false);
  };

  const render = (time: number) => {
    if (disposed) {
      return;
    }

    const delta = time - previous;
    previous = time;
    frames.push(delta);
    if (frames.length > 180) {
      frames.shift();
    }

    benchmarkScene.controls.update();

    if (settings.animate) {
      for (const material of benchmarkScene.materials) {
        if (material.uniforms?.time) {
          material.uniforms.time.value = time / 1000;
        }
      }
    }

    try {
      const output = renderer.render(benchmarkScene.scene, benchmarkScene.camera);
      if (output instanceof Promise) {
        output.catch((error: unknown) => {
          throw error;
        });
      }
    } catch (error) {
      disposed = true;
      const message = error instanceof Error ? error.message : String(error);
      statusText.textContent = `Render failed: ${message}`;
      return;
    }

    if (time - lastMetricsUpdate > 250) {
      lastMetricsUpdate = time;
      updateMetrics(renderer, benchmarkScene, frames);
    }

    animationFrame = requestAnimationFrame(render);
  };

  window.addEventListener("resize", resize);
  resize();
  statusText.textContent = createStatusText(renderer, settings, benchmarkScene.stats);
  animationFrame = requestAnimationFrame(render);

  return () => {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resize);
    benchmarkScene.dispose();
    renderer.dispose();
    canvas.remove();
  };
}

function createStatusText(
  renderer: BenchmarkRenderer,
  settings: BenchmarkSettings,
  stats: SceneStats,
): string {
  const rendererLabel =
    settings.renderer === "webgpu"
      ? detectWebGpuBackend(renderer)
      : `WebGL ${renderer.capabilities.isWebGL2 ? "2" : "1"}`;
  const materialLabel = settings.material === "tsl" ? "TSL WebGPU shader" : "GLSL WebGL shader";
  return `${rendererLabel}, ${materialLabel}, ${stats.vertices.toLocaleString()} vertices.`;
}

function detectWebGpuBackend(renderer: BenchmarkRenderer): string {
  const backend = "backend" in renderer ? renderer.backend : undefined;
  if ((backend as { isWebGPUBackend?: boolean } | undefined)?.isWebGPUBackend) {
    return "WebGPU";
  }

  if ((backend as { isWebGLBackend?: boolean } | undefined)?.isWebGLBackend) {
    return "WebGPU renderer with WebGL fallback";
  }

  return "WebGPU renderer";
}

function updateMetrics(
  renderer: BenchmarkRenderer,
  benchmarkScene: BenchmarkScene,
  frames: number[],
): void {
  const average = frames.reduce((sum, frame) => sum + frame, 0) / Math.max(frames.length, 1);
  const sorted = [...frames].sort((a, b) => a - b);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
  metricElements.fps.textContent = `${Math.round(1000 / average)}`;
  metricElements.frame.textContent = `${average.toFixed(2)} ms`;
  metricElements.p95.textContent = `${p95.toFixed(2)} ms`;
  metricElements.calls.textContent = `${renderer.info.render.calls}`;
  metricElements.triangles.textContent = `${Math.round(benchmarkScene.stats.triangles).toLocaleString()}`;
  metricElements.build.textContent = `${benchmarkScene.stats.buildMs.toFixed(1)} ms`;
}

function resetMetrics(): void {
  metricElements.fps.textContent = "--";
  metricElements.frame.textContent = "-- ms";
  metricElements.p95.textContent = "-- ms";
  metricElements.calls.textContent = "--";
  metricElements.triangles.textContent = "--";
  metricElements.build.textContent = "-- ms";
}

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function readNumber(
  params: URLSearchParams,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = Number(params.get(name));
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function getElement<T extends HTMLElement>(
  id: string,
  elementType: { new (...args: never[]): T },
): T {
  const element = document.getElementById(id);
  if (!(element instanceof elementType)) {
    throw new Error(`Missing #${id}`);
  }

  return element;
}

for (const input of [pathsInput, segmentsInput, dprInput]) {
  input.addEventListener("input", () => updateControlOutputs(readSettingsFromControls()));
}

rendererInput.addEventListener("change", () => {
  const settings = normalizeSettings(readSettingsFromControls());
  applySettingsToControls(settings);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void start(readSettingsFromControls());
});

const initialSettings = normalizeSettings(readSettingsFromUrl());
applySettingsToControls(initialSettings);
void start(initialSettings);
