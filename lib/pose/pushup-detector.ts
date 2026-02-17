import type { Landmark, PushUpPhase, PushUpState } from "./types";
import { calculateAngle } from "./angles";
import {
  LANDMARK,
  ANGLE_DOWN_THRESHOLD,
  ANGLE_UP_THRESHOLD,
  SMOOTHING,
  DEBOUNCE_FRAMES,
  MIN_TRANSITION_MS,
  MIN_VISIBILITY,
  MAX_TORSO_ANGLE,
} from "./constants";

export function createInitialState(): PushUpState {
  return {
    phase: "up",
    count: 0,
    elbowAngle: 180,
    smoothedAngle: 180,
    consecutiveFrames: 0,
    lastTransitionTime: 0,
  };
}

/**
 * Get elbow angle from the more visible side.
 * Uses min(left, right) when both are visible — both arms must bend.
 */
function getElbowAngle(landmarks: Landmark[]): number | null {
  const ls = landmarks[LANDMARK.LEFT_SHOULDER];
  const le = landmarks[LANDMARK.LEFT_ELBOW];
  const lw = landmarks[LANDMARK.LEFT_WRIST];
  const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
  const re = landmarks[LANDMARK.RIGHT_ELBOW];
  const rw = landmarks[LANDMARK.RIGHT_WRIST];

  const leftVis = Math.min(ls.visibility, le.visibility, lw.visibility);
  const rightVis = Math.min(rs.visibility, re.visibility, rw.visibility);

  const leftOk = leftVis > MIN_VISIBILITY;
  const rightOk = rightVis > MIN_VISIBILITY;

  if (!leftOk && !rightOk) return null;

  const leftAngle = leftOk ? calculateAngle(ls, le, lw) : null;
  const rightAngle = rightOk ? calculateAngle(rs, re, rw) : null;

  // When both visible, use min — requires both arms to actually bend
  if (leftAngle !== null && rightAngle !== null) {
    return Math.min(leftAngle, rightAngle);
  }
  return leftAngle ?? rightAngle;
}

/**
 * Check if the person is in a horizontal push-up position (not standing).
 * Measures the torso angle from horizontal using shoulder and hip landmarks.
 * atan2(|dy|, |dx|) — near 0° = horizontal (push-up), near 90° = vertical (standing).
 * Returns true if torso angle from horizontal < MAX_TORSO_ANGLE.
 */
function isInPushUpPosition(landmarks: Landmark[]): boolean {
  const ls = landmarks[LANDMARK.LEFT_SHOULDER];
  const lh = landmarks[LANDMARK.LEFT_HIP];
  const rs = landmarks[LANDMARK.RIGHT_SHOULDER];
  const rh = landmarks[LANDMARK.RIGHT_HIP];

  const leftVis = Math.min(ls.visibility, lh.visibility);
  const rightVis = Math.min(rs.visibility, rh.visibility);

  let shoulder: Landmark;
  let hip: Landmark;

  if (leftVis >= rightVis && leftVis > MIN_VISIBILITY) {
    shoulder = ls;
    hip = lh;
  } else if (rightVis > MIN_VISIBILITY) {
    shoulder = rs;
    hip = rh;
  } else {
    // Can't determine position — allow it
    return true;
  }

  const dx = Math.abs(hip.x - shoulder.x);
  const dy = Math.abs(hip.y - shoulder.y);
  const angleFromHorizontal = Math.atan2(dy, dx) * (180 / Math.PI);

  return angleFromHorizontal < MAX_TORSO_ANGLE;
}

export function updatePushUpState(
  prev: PushUpState,
  landmarks: Landmark[]
): PushUpState {
  const rawAngle = getElbowAngle(landmarks);
  if (rawAngle === null) return prev;

  // EMA smoothing
  const smoothedAngle =
    prev.smoothedAngle * (1 - SMOOTHING) + rawAngle * SMOOTHING;

  const now = performance.now();
  const timeSinceTransition = now - prev.lastTransitionTime;

  let nextPhase: PushUpPhase = prev.phase;
  let nextCount = prev.count;
  let nextConsecutive = prev.consecutiveFrames;
  let nextTransitionTime = prev.lastTransitionTime;

  // Only consider transitions after minimum time gap and in push-up position
  const inPosition = isInPushUpPosition(landmarks);

  if (timeSinceTransition > MIN_TRANSITION_MS && inPosition) {
    if (prev.phase === "up" && smoothedAngle < ANGLE_DOWN_THRESHOLD) {
      nextConsecutive++;
      if (nextConsecutive >= DEBOUNCE_FRAMES) {
        nextPhase = "down";
        nextConsecutive = 0;
        nextTransitionTime = now;
      }
    } else if (prev.phase === "down" && smoothedAngle > ANGLE_UP_THRESHOLD) {
      nextConsecutive++;
      if (nextConsecutive >= DEBOUNCE_FRAMES) {
        nextPhase = "up";
        nextCount++;
        nextConsecutive = 0;
        nextTransitionTime = now;
      }
    } else {
      nextConsecutive = 0;
    }
  }

  return {
    phase: nextPhase,
    count: nextCount,
    elbowAngle: rawAngle,
    smoothedAngle,
    consecutiveFrames: nextConsecutive,
    lastTransitionTime: nextTransitionTime,
  };
}
