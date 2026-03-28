import type { Landmark, PushUpPhase } from "./types";
import {
  SKELETON_CONNECTIONS,
  ANGLE_DOWN_THRESHOLD,
  ANGLE_UP_THRESHOLD,
} from "./constants";

/**
 * Progress toward the next threshold (0 → 1).
 * "up" phase: progress = how close to bending down to 90°
 * "down" phase: progress = how close to extending back to 145°
 */
function getProgress(phase: PushUpPhase, angle: number): number {
  if (phase === "up") {
    const start = ANGLE_UP_THRESHOLD;
    const end = ANGLE_DOWN_THRESHOLD;
    return Math.max(0, Math.min(1, (start - angle) / (start - end)));
  }
  const start = ANGLE_DOWN_THRESHOLD;
  const end = ANGLE_UP_THRESHOLD;
  return Math.max(0, Math.min(1, (angle - start) / (end - start)));
}

/** Map progress (0-1) → red → yellow → green. */
function progressColor(progress: number, alpha: number): string {
  const hue = progress * 120;
  return `hsla(${hue}, 100%, 50%, ${alpha})`;
}

export interface DrawOptions {
  phase: PushUpPhase;
  angle: number;
}

export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  options?: DrawOptions
): void {
  ctx.clearRect(0, 0, width, height);

  const progress = options ? getProgress(options.phase, options.angle) : 0;
  const lineColor = options
    ? progressColor(progress, 0.8)
    : "rgba(255, 255, 255, 0.6)";
  const dotColor = options
    ? progressColor(progress, 1)
    : "rgba(255, 255, 255, 0.9)";

  // Skeleton connections
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  for (const [i, j] of SKELETON_CONNECTIONS) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b || a.visibility < 0.5 || b.visibility < 0.5) continue;

    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  }

  // Keypoints
  ctx.fillStyle = dotColor;
  for (const lm of landmarks) {
    if (lm.visibility < 0.5) continue;
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}
