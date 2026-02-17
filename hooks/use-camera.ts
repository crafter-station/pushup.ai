"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Camera access denied"
      );
    }
  }, [facingMode]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const flip = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (isActive) {
      stop();
      // restart with new facing mode on next tick
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: next,
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          setIsActive(true);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Camera access denied"
          );
        }
      }, 100);
    }
  }, [facingMode, isActive, stop]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, isActive, error, start, stop, flip };
}
