// MediaPipe Pose Landmark indices (33 keypoints)
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

// Ultralytics AIGym defaults — wide hysteresis band prevents false counts
export const ANGLE_DOWN_THRESHOLD = 110;
export const ANGLE_UP_THRESHOLD = 145;

// Keypoint confidence gate
export const MIN_VISIBILITY = 0.5;

// Skeleton connections for drawing
export const SKELETON_CONNECTIONS: [number, number][] = [
  // Torso (diamond: same-side + cross connections)
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 12],
  [24, 11],
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
