"use client";

import { useRef, useState, useEffect } from "react";
import type { Landmark } from "@/lib/pose/types";
import type { PushUpDrawState } from "./use-pushup-counter";
import { getPoseLandmarker, disposePoseLandmarker } from "@/lib/pose/mediapipe";
import { drawPose } from "@/lib/pose/draw";

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isActive: boolean,
  onLandmarks: (landmarks: Landmark[]) => PushUpDrawState
) {
  const [fps, setFps] = useState(0);
  const rafRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef(0);
  const onLandmarksRef = useRef(onLandmarks);
  onLandmarksRef.current = onLandmarks;

  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(rafRef.current);
      setFps(0);
      return;
    }

    fpsIntervalRef.current = performance.now();
    frameCountRef.current = 0;

    const detect = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const landmarker = await getPoseLandmarker();
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        const canvas = canvasRef.current;

        if (result.landmarks && result.landmarks.length > 0) {
          const lms = result.landmarks[0] as Landmark[];
          const drawState = onLandmarksRef.current(lms);

          if (canvas) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext("2d");
            if (ctx) drawPose(ctx, lms, canvas.width, canvas.height, drawState);
          }
        } else if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }

        frameCountRef.current++;
        if (now - fpsIntervalRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          fpsIntervalRef.current = now;
        }
      } catch {
        // skip frame on error
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, videoRef, canvasRef]);

  useEffect(() => {
    return () => {
      disposePoseLandmarker();
    };
  }, []);

  return { fps };
}
