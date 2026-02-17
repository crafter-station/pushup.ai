// MediaPipe Pose Landmark indices
export const LANDMARK = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

// Push-up detection thresholds
// DOWN: arms must bend below this angle
export const ANGLE_DOWN_THRESHOLD = 110;
// UP: arms must extend above this angle
export const ANGLE_UP_THRESHOLD = 140;

// EMA smoothing alpha (0.4 = responsive enough for consecutive reps)
export const SMOOTHING = 0.4;

// Debounce: consecutive frames required to confirm transition
export const DEBOUNCE_FRAMES = 2;

// Minimum ms between state transitions (prevents impossibly fast reps)
export const MIN_TRANSITION_MS = 300;

// Landmark confidence gate
export const MIN_VISIBILITY = 0.5;

// Max torso angle from horizontal (degrees) to be considered in push-up position
// < 45° = horizontal (push-up), > 45° = vertical (standing)
export const MAX_TORSO_ANGLE = 45;

// Skeleton connections for drawing
export const SKELETON_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
];
