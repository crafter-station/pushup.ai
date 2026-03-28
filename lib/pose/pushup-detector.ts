import type { Landmark, PushUpState } from "./types";
import { calculateAngle } from "./angles";
import {
  LANDMARK,
  ANGLE_DOWN_THRESHOLD,
  ANGLE_UP_THRESHOLD,
  MIN_VISIBILITY,
} from "./constants";

export function createInitialState(): PushUpState {
  return { phase: "up", count: 0, angle: 180 };
}

/**
 * Get the best visible elbow angle.
 * Prefers right arm, falls back to left.
 */
function getElbowAngle(landmarks: Landmark[]): number | null {
  const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
  const re = landmarks[LANDMARK.RIGHT_ELBOW];
  const rw = landmarks[LANDMARK.RIGHT_WRIST];

  if (Math.min(rs.visibility, re.visibility, rw.visibility) > MIN_VISIBILITY) {
    return calculateAngle(rs, re, rw);
  }

  const ls = landmarks[LANDMARK.LEFT_SHOULDER];
  const le = landmarks[LANDMARK.LEFT_ELBOW];
  const lw = landmarks[LANDMARK.LEFT_WRIST];

  if (Math.min(ls.visibility, le.visibility, lw.visibility) > MIN_VISIBILITY) {
    return calculateAngle(ls, le, lw);
  }

  return null;
}

/**
 * Reject standing posture: hips far below shoulders means the person
 * is upright, not in a push-up position.
 *
 * Push-up: body is roughly horizontal → hip-shoulder Y gap is small
 * Standing: body is vertical → hip-shoulder Y gap is large (>1.2× shoulder width)
 */
function isInPushUpPosition(landmarks: Landmark[]): boolean {
  const ls = landmarks[LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[LANDMARK.LEFT_HIP];
  const rh = landmarks[LANDMARK.RIGHT_HIP];

  const shouldersOk = ls.visibility > MIN_VISIBILITY && rs.visibility > MIN_VISIBILITY;
  const hipsOk = lh.visibility > MIN_VISIBILITY && rh.visibility > MIN_VISIBILITY;

  // If we can't see both shoulders + hips, allow it (can't determine)
  if (!shouldersOk || !hipsOk) return true;

  const shoulderMidY = (ls.y + rs.y) / 2;
  const hipMidY = (lh.y + rh.y) / 2;
  const shoulderWidth = Math.abs(rs.x - ls.x);

  if (shoulderWidth === 0) return true;

  // Standing → gap is ~1.5-3× shoulder width; push-up → gap is < 1×
  const hipBelowShoulder = hipMidY - shoulderMidY;
  return hipBelowShoulder / shoulderWidth < 1.2;
}

/**
 * Hysteresis state machine with standing rejection.
 * Count increments on "up → down" transition (immediate feedback at depth).
 */
export function updatePushUpState(
  prev: PushUpState,
  landmarks: Landmark[]
): PushUpState {
  const angle = getElbowAngle(landmarks);
  if (angle === null) return prev;

  // Don't count reps if the person is standing
  if (!isInPushUpPosition(landmarks)) {
    return { ...prev, angle };
  }

  let phase = prev.phase;
  let count = prev.count;

  if (angle < ANGLE_DOWN_THRESHOLD) {
    if (phase === "up") count++;
    phase = "down";
  } else if (angle > ANGLE_UP_THRESHOLD) {
    phase = "up";
  }

  return { phase, count, angle };
}
