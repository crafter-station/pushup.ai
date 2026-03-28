"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "@/hooks/use-camera";
import { usePoseDetection } from "@/hooks/use-pose-detection";
import { usePushUpCounter } from "@/hooks/use-pushup-counter";
import { ANGLE_DOWN_THRESHOLD } from "@/lib/pose/constants";

const ANGLE_MAX = 180;
const ANGLE_MIN = 45;
const ANGLE_RANGE = ANGLE_MAX - ANGLE_MIN;

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function PushUpSession() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { videoRef, isActive, error, start, stop, flip } = useCamera();
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const prevCountRef = useRef(0);

  const {
    count,
    phase,
    elbowAngle,
    reset,
    processLandmarks,
    getSessionDurationMs,
  } = usePushUpCounter();

  const countdownActive = countdown !== null && countdown > 0;

  const { fps } = usePoseDetection(
    videoRef,
    canvasRef,
    isActive && !isPaused,
    countdownActive
      ? () => ({ phase: "up" as const, angle: 180 })
      : processLandmarks
  );

  // Countdown after start (3 → 2 → 1 → GO)
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const id = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // When countdown finishes, reset to clear any false positives from positioning
  useEffect(() => {
    if (countdown !== 0) return;
    reset();
    prevCountRef.current = 0;
    setTimer(0);
    setCountdown(null);
  }, [countdown, reset]);

  // Timer — don't run during countdown
  useEffect(() => {
    if (!isActive || isPaused || countdown !== null) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isActive, isPaused, countdown]);

  // Blue flash on rep
  useEffect(() => {
    if (count > prevCountRef.current) {
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 300);
      prevCountRef.current = count;
      return () => clearTimeout(id);
    }
  }, [count]);

  // Height meter
  const indicatorPos = Math.max(
    0,
    Math.min(1, (ANGLE_MAX - elbowAngle) / ANGLE_RANGE)
  );
  const blueZoneTop = (ANGLE_MAX - ANGLE_DOWN_THRESHOLD) / ANGLE_RANGE;
  const isInZone = phase === "down";

  const captureScreenshot = (): string | null => {
    const video = videoRef.current;
    const landmarks = canvasRef.current;
    if (!video || !video.videoWidth) return null;
    const offscreen = document.createElement("canvas");
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    if (landmarks && landmarks.width > 0) {
      ctx.drawImage(landmarks, 0, 0, offscreen.width, offscreen.height);
    }
    return offscreen.toDataURL("image/jpeg", 0.7);
  };

  const handleShare = async () => {
    if (count === 0 || isSharing) return;
    setIsSharing(true);
    try {
      const screenshot = captureScreenshot();
      const durationMs = getSessionDurationMs();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, durationMs, screenshot }),
      });
      if (!res.ok) throw new Error("Failed to save session");
      const { id } = await res.json();
      router.push(`/share/${id}`);
    } catch (err) {
      console.error("Share failed:", err);
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    stop();
    if (count > 0) {
      handleShare();
    } else {
      router.push("/");
    }
  };

  const handleStart = () => {
    reset();
    setTimer(0);
    setIsPaused(false);
    prevCountRef.current = 0;
    start();
    setCountdown(8);
  };

  return (
    <div className="h-dvh flex flex-col bg-white">
      {/* Camera area — video always in DOM so videoRef is never null */}
      <div className="relative flex-1 min-h-0 bg-black rounded-b-[2rem] overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Pre-start overlay */}
        {!isActive && (
          <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center gap-5">
            {error && (
              <p className="text-red-500 text-sm px-8 text-center">{error}</p>
            )}
            <button
              onClick={handleStart}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 ml-1" fill="black">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <span className="text-white/40 text-sm tracking-wider">
              TAP TO START
            </span>
          </div>
        )}

        {/* Countdown overlay with positioning instructions */}
        {isActive && countdownActive && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 pointer-events-none px-8">
            <span className="text-[120px] leading-none font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] tabular-nums">
              {countdown}
            </span>
            <div className="mt-6 flex flex-col items-center gap-3">
              <span className="text-white text-xl font-bold tracking-wide">
                GET IN POSITION
              </span>
              <div className="flex flex-col items-center gap-1.5 text-white/70 text-sm">
                <span>Place your phone on the ground facing you</span>
                <span>Make sure your full body is visible</span>
                <span>Get into push-up position and hold</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-8 w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((8 - countdown) / 8) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Active overlays */}
        {isActive && (
          <>
            {/* Blue flash on rep */}
            {flash && (
              <div className="absolute inset-0 bg-blue-500/20 pointer-events-none z-10" />
            )}

            {/* Top controls */}
            <div
              className="absolute left-0 right-0 flex justify-between px-4 z-20"
              style={{ top: "calc(max(env(safe-area-inset-top, 12px), 12px) + 4px)" }}
            >
              <button
                onClick={flip}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
                  <circle cx="12" cy="14" r="3" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                disabled={isSharing}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Height meter — below top buttons, above bottom counter */}
            <div className="absolute right-4 top-16 bottom-24 w-8 z-10">
              <div className="relative h-full rounded-full bg-black/40 backdrop-blur-md">
                {/* Blue target zone */}
                <div
                  className="absolute left-1.5 right-1.5 rounded-full bg-blue-500"
                  style={{
                    top: `${blueZoneTop * 100}%`,
                    bottom: "4px",
                  }}
                />
                {/* White indicator */}
                <div
                  className="absolute left-1.5 right-1.5 rounded-full transition-all duration-100 ease-out"
                  style={{
                    height: "14%",
                    top: `${Math.min(indicatorPos * 86, 86)}%`,
                    backgroundColor: isInZone ? "#3b82f6" : "white",
                    boxShadow: isInZone
                      ? "0 0 16px 6px rgba(59,130,246,0.7)"
                      : "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            </div>

            {/* Rep counter overlay */}
            <div className="absolute bottom-4 left-4 z-10 flex items-baseline gap-1.5">
              <span className="text-[64px] leading-none font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] tabular-nums">
                {count}
              </span>
              <span className="text-lg font-semibold text-white/70 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                reps
              </span>
            </div>
          </>
        )}
      </div>

      {/* Bottom card */}
      <div
        className="shrink-0 px-6 pt-5"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[56px] leading-none font-black tracking-tight tabular-nums">
              {count}
            </span>
            <span className="text-xl text-neutral-400 font-medium">Reps</span>
          </div>

          <div className="flex items-center gap-3">
            {count > 0 && (
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center active:scale-95 transition-transform"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke={isSharing ? "#9ca3af" : "#22c55e"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v13" />
                </svg>
              </button>
            )}
            {isActive && (
              <button
                onClick={() => setIsPaused((p) => !p)}
                className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                {isPaused ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 ml-0.5"
                    fill="black"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="black">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="text-[40px] leading-tight font-bold tracking-tight tabular-nums mt-1">
          {formatTime(timer)}
        </div>
      </div>
    </div>
  );
}
