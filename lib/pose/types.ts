export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export type PushUpPhase = "up" | "down";

export interface PushUpState {
  phase: PushUpPhase;
  count: number;
  elbowAngle: number;
  smoothedAngle: number;
  consecutiveFrames: number;
  lastTransitionTime: number;
}

export interface PoseResult {
  landmarks: Landmark[];
  timestamp: number;
}
