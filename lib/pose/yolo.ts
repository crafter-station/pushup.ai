import * as ort from "onnxruntime-web";
import type { Landmark } from "./types";

const MODEL_URL = "/models/yolov8n-pose.onnx";
const INPUT_SIZE = 640;
const CONF_THRESHOLD = 0.25;
const NUM_KEYPOINTS = 17;

// Point WASM runtime to CDN so we don't need to copy .wasm files to public/
ort.env.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/";

let session: ort.InferenceSession | null = null;
let initPromise: Promise<ort.InferenceSession> | null = null;
let ppCanvas: OffscreenCanvas | null = null;

export async function getYoloSession(): Promise<ort.InferenceSession> {
  if (session) return session;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["wasm"],
    });
    return session;
  })();

  return initPromise;
}

export function disposeYoloSession(): void {
  session = null;
  initPromise = null;
}

// ── Preprocessing ──────────────────────────────────────────────────

function preprocess(video: HTMLVideoElement) {
  if (!ppCanvas) ppCanvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
  const ctx = ppCanvas.getContext("2d")!;

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // Letterbox: maintain aspect ratio, pad with gray
  const scale = Math.min(INPUT_SIZE / vw, INPUT_SIZE / vh);
  const nw = Math.round(vw * scale);
  const nh = Math.round(vh * scale);
  const padX = Math.round((INPUT_SIZE - nw) / 2);
  const padY = Math.round((INPUT_SIZE - nh) / 2);

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
  ctx.drawImage(video, padX, padY, nw, nh);

  const { data } = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);

  // NCHW float32, normalised to [0,1]
  const float32 = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
  const px = INPUT_SIZE * INPUT_SIZE;
  for (let i = 0; i < px; i++) {
    float32[i] = data[i * 4] / 255; // R
    float32[px + i] = data[i * 4 + 1] / 255; // G
    float32[2 * px + i] = data[i * 4 + 2] / 255; // B
  }

  return { tensor: float32, scale, padX, padY };
}

// ── Postprocessing ─────────────────────────────────────────────────

function postprocess(
  raw: Float32Array,
  scale: number,
  padX: number,
  padY: number,
  videoWidth: number,
  videoHeight: number
): Landmark[] | null {
  // Output shape [1, 56, 8400]  →  data[feature * 8400 + proposal]
  const N = 8400;

  // Find proposal with highest person-confidence (feature 4)
  let bestConf = CONF_THRESHOLD;
  let bestIdx = -1;
  for (let j = 0; j < N; j++) {
    const conf = raw[4 * N + j];
    if (conf > bestConf) {
      bestConf = conf;
      bestIdx = j;
    }
  }
  if (bestIdx === -1) return null;

  const scaledW = videoWidth * scale;
  const scaledH = videoHeight * scale;
  const landmarks: Landmark[] = [];

  for (let k = 0; k < NUM_KEYPOINTS; k++) {
    const base = 5 + k * 3;
    const kpX = raw[base * N + bestIdx];
    const kpY = raw[(base + 1) * N + bestIdx];
    const kpC = raw[(base + 2) * N + bestIdx];

    landmarks.push({
      x: Math.max(0, Math.min(1, (kpX - padX) / scaledW)),
      y: Math.max(0, Math.min(1, (kpY - padY) / scaledH)),
      z: 0,
      visibility: kpC,
    });
  }

  return landmarks;
}

// ── Public API ─────────────────────────────────────────────────────

export async function detectPose(
  video: HTMLVideoElement
): Promise<Landmark[] | null> {
  const sess = await getYoloSession();
  const { tensor, scale, padX, padY } = preprocess(video);

  const input = new ort.Tensor("float32", tensor, [
    1,
    3,
    INPUT_SIZE,
    INPUT_SIZE,
  ]);
  const results = await sess.run({ images: input });

  return postprocess(
    results.output0.data as Float32Array,
    scale,
    padX,
    padY,
    video.videoWidth,
    video.videoHeight
  );
}
