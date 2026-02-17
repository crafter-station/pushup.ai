import type { Landmark, PushUpPhase } from "./types";
import {
  SKELETON_CONNECTIONS,
  ANGLE_DOWN_THRESHOLD,
  ANGLE_UP_THRESHOLD,
} from "./constants";

/**
 * Compute progress toward the next threshold (0 → 1).
 * In "up" phase: progress = how close to bending down to 90°
 * In "down" phase: progress = how close to extending back to 160°
 */
function getProgress(phase: PushUpPhase, smoothedAngle: number): number {
  if (phase === "up") {
    // Going from ~180° down toward 90°. Progress = 1 when at 90°.
    const start = ANGLE_UP_THRESHOLD; // 160° (where "up" begins)
    const end = ANGLE_DOWN_THRESHOLD; // 90° (target)
    return Math.max(0, Math.min(1, (start - smoothedAngle) / (start - end)));
  }
  // "down" phase: going from ~90° up toward 160°. Progress = 1 when at 160°.
  const start = ANGLE_DOWN_THRESHOLD; // 90° (where "down" begins)
  const end = ANGLE_UP_THRESHOLD; // 160° (target)
  return Math.max(0, Math.min(1, (smoothedAngle - start) / (end - start)));
}

/**
 * Map progress (0-1) to a color.
 * 0.0 → red (hue 0)
 * 0.5 → yellow (hue 60)
 * 1.0 → green (hue 120)
 */
function progressColor(progress: number, alpha: number): string {
  const hue = progress * 120;
  return `hsla(${hue}, 100%, 50%, ${alpha})`;
}

export interface DrawOptions {
  phase: PushUpPhase;
  smoothedAngle: number;
}

export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  options?: DrawOptions
): void {
  ctx.clearRect(0, 0, width, height);

  const progress = options
    ? getProgress(options.phase, options.smoothedAngle)
    : 0;
  const lineColor = options
    ? progressColor(progress, 0.8)
    : "rgba(255, 255, 255, 0.6)";
  const dotColor = options
    ? progressColor(progress, 1)
    : "rgba(255, 255, 255, 0.9)";

  // Draw skeleton connections
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

  // Draw keypoints
  ctx.fillStyle = dotColor;
  for (const lm of landmarks) {
    if (lm.visibility < 0.5) continue;
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}
