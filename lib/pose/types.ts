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
  angle: number;
}

export interface PoseResult {
  landmarks: Landmark[];
  timestamp: number;
}
