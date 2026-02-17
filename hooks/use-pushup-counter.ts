"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Landmark, PushUpPhase, PushUpState } from "@/lib/pose/types";
import {
  createInitialState,
  updatePushUpState,
} from "@/lib/pose/pushup-detector";

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => ctx.close();
  } catch {
    // audio not available
  }
}

export interface PushUpDrawState {
  phase: PushUpPhase;
  smoothedAngle: number;
}

export interface RecordedFrame {
  t: number;
  raw: number;
  smoothed: number;
  phase: PushUpPhase;
  count: number;
}

export function usePushUpCounter() {
  const stateRef = useRef<PushUpState>(createInitialState());
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<PushUpState["phase"]>("up");
  const [elbowAngle, setElbowAngle] = useState(180);

  // Recording
  const recordingRef = useRef(false);
  const framesRef = useRef<RecordedFrame[]>([]);
  const startTimeRef = useRef(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<RecordedFrame[] | null>(
    null
  );
  // Live stream: last N frames, updated on a 500ms interval
  const [liveFrames, setLiveFrames] = useState<RecordedFrame[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const processLandmarks = useCallback(
    (landmarks: Landmark[]): PushUpDrawState => {
      const prev = stateRef.current;
      const next = updatePushUpState(prev, landmarks);
      stateRef.current = next;

      if (next.count !== prev.count) {
        setCount(next.count);
        playBeep();
      }
      if (next.phase !== prev.phase) setPhase(next.phase);
      if (Math.round(next.elbowAngle) !== Math.round(prev.elbowAngle)) {
        setElbowAngle(next.elbowAngle);
      }

      // Record frame if recording
      if (recordingRef.current) {
        framesRef.current.push({
          t: Math.round(performance.now() - startTimeRef.current),
          raw: Math.round(next.elbowAngle * 10) / 10,
          smoothed: Math.round(next.smoothedAngle * 10) / 10,
          phase: next.phase,
          count: next.count,
        });
      }

      return { phase: next.phase, smoothedAngle: next.smoothedAngle };
    },
    []
  );

  const startRecording = useCallback(() => {
    framesRef.current = [];
    startTimeRef.current = performance.now();
    recordingRef.current = true;
    setIsRecording(true);
    setRecordedData(null);
    setLiveFrames([]);

    // Flush last 8 frames to state every 500ms
    intervalRef.current = setInterval(() => {
      const all = framesRef.current;
      setLiveFrames(all.slice(-8));
    }, 500);
  }, []);

  const stopRecording = useCallback(() => {
    recordingRef.current = false;
    setIsRecording(false);
    setRecordedData([...framesRef.current]);
    setLiveFrames([]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearRecording = useCallback(() => {
    setRecordedData(null);
    framesRef.current = [];
  }, []);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
    setCount(0);
    setPhase("up");
    setElbowAngle(180);
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    count,
    phase,
    elbowAngle,
    reset,
    processLandmarks,
    isRecording,
    recordedData,
    liveFrames,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
