"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "@/hooks/use-camera";
import { usePoseDetection } from "@/hooks/use-pose-detection";
import { usePushUpCounter } from "@/hooks/use-pushup-counter";
import { CameraFeed } from "./camera-feed";
import { CounterDisplay } from "@/components/ui/counter-display";

export function PushUpSession() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { videoRef, isActive, error, start, stop, flip } = useCamera();
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const {
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
    getSessionDurationMs,
  } = usePushUpCounter();
  const { fps } = usePoseDetection(
    videoRef,
    canvasRef,
    isActive,
    processLandmarks
  );

  const captureScreenshot = (): string | null => {
    const video = videoRef.current;
    const landmarks = canvasRef.current;
    if (!video || !video.videoWidth) return null;
    const offscreen = document.createElement("canvas");
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return null;
    // Draw video frame first, then landmarks overlay on top
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

  const btnClass =
    "px-6 py-2 border border-white/20 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-colors backdrop-blur-sm";

  return (
    <div className="relative z-10 flex flex-col items-center min-h-screen">
      {/* Full-screen camera feed */}
      <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />

      {/* Overlay UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-12 pointer-events-none">
        {/* Counter */}
        <div className="flex flex-col items-center gap-2">
          <CounterDisplay count={count} />
          {isRecording && (
            <span className="font-mono text-[10px] text-red-500 uppercase tracking-widest animate-pulse">
              REC
            </span>
          )}
        </div>

        {/* Bottom info + controls */}
        <div className="flex flex-col items-center gap-4 pointer-events-auto">
          {/* Phase & angle bar */}
          <div className="flex items-center gap-6 font-mono text-[10px] text-white/50 uppercase tracking-widest">
            <span>PHASE: {phase.toUpperCase()}</span>
            <span>ANGLE: {Math.round(elbowAngle)}&deg;</span>
            <span>FPS: {fps}</span>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 font-mono text-xs">{error}</p>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {!isActive ? (
              <button onClick={start} className={btnClass}>
                START
              </button>
            ) : (
              <button onClick={stop} className={btnClass}>
                STOP
              </button>
            )}
            <button onClick={reset} className={btnClass}>
              RESET
            </button>
            {count > 0 && (
              <button
                onClick={handleShare}
                disabled={isSharing}
                className={`${btnClass} border-green-500/40 text-green-400 ${isSharing ? "opacity-50" : ""}`}
              >
                {isSharing ? "SHARING..." : "SHARE"}
              </button>
            )}
            {isActive && (
              <>
                <button onClick={flip} className={btnClass}>
                  FLIP
                </button>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className={`${btnClass} border-red-500/40 text-red-400`}
                  >
                    REC
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className={`${btnClass} border-red-500/60 text-red-400 animate-pulse`}
                  >
                    STOP REC
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live stream panel */}
      {isRecording && liveFrames.length > 0 && (
        <div className="fixed top-4 right-4 z-20 w-72 pointer-events-none">
          <div className="bg-black/80 border border-white/10 rounded backdrop-blur-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest">
                LIVE DATA
              </span>
              <span className="font-mono text-[9px] text-red-500 animate-pulse">
                ●
              </span>
            </div>
            <div className="font-mono text-[10px] text-white/70 space-y-px overflow-hidden">
              {liveFrames.map((f, i) => (
                <div
                  key={f.t}
                  className="flex gap-2 transition-opacity"
                  style={{ opacity: 0.4 + (i / liveFrames.length) * 0.6 }}
                >
                  <span className="text-white/30 w-12 text-right shrink-0">
                    {(f.t / 1000).toFixed(1)}s
                  </span>
                  <span className="w-10 shrink-0">
                    {f.raw}&deg;
                  </span>
                  <span className="w-10 text-white/40 shrink-0">
                    ~{f.smoothed}&deg;
                  </span>
                  <span
                    className={
                      f.phase === "down" ? "text-yellow-400" : "text-green-400"
                    }
                  >
                    {f.phase}
                  </span>
                  {f.count > 0 && (
                    <span className="text-white/50">#{f.count}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recorded data panel (full screen, after stop) */}
      {recordedData && (
        <div className="fixed inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-white/60 uppercase tracking-widest">
                RECORDED: {recordedData.length} FRAMES
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(recordedData, null, 2)
                    );
                  }}
                  className={btnClass}
                >
                  COPY
                </button>
                <button onClick={clearRecording} className={btnClass}>
                  CLOSE
                </button>
              </div>
            </div>
            <pre className="bg-white/5 border border-white/10 rounded p-4 font-mono text-[11px] text-white/80 overflow-auto max-h-[70vh] select-all">
              {JSON.stringify(recordedData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
