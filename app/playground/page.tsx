"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { calculateAngle } from "@/lib/pose/angles";
import {
  LANDMARK,
  SKELETON_CONNECTIONS,
  ANGLE_DOWN_THRESHOLD,
  ANGLE_UP_THRESHOLD,
} from "@/lib/pose/constants";
import type { Landmark } from "@/lib/pose/types";

/**
 * Ordered top-to-bottom matching the front-facing push-up diagram:
 *
 *         o───────o           hips (top, narrower)
 *        ╱ \     / ╲
 *       o───────────o         shoulders (wider)
 *      ╱               ╲
 *     o                 o     elbows (flared out)
 *      \               /
 *       o             o       wrists (on floor)
 *   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   floor
 */
const POINTS = [
  { index: LANDMARK.LEFT_HIP, label: "L Hip", color: "#60a5fa" },
  { index: LANDMARK.RIGHT_HIP, label: "R Hip", color: "#60a5fa" },
  { index: LANDMARK.LEFT_SHOULDER, label: "L Shoulder", color: "#4ade80" },
  { index: LANDMARK.RIGHT_SHOULDER, label: "R Shoulder", color: "#4ade80" },
  { index: LANDMARK.LEFT_ELBOW, label: "L Elbow", color: "#facc15" },
  { index: LANDMARK.RIGHT_ELBOW, label: "R Elbow", color: "#facc15" },
  { index: LANDMARK.LEFT_WRIST, label: "L Wrist", color: "#f87171" },
  { index: LANDMARK.RIGHT_WRIST, label: "R Wrist", color: "#f87171" },
] as const;

const POINT_MAP = new Map(POINTS.map((p) => [p.index, p]));

function buildLandmarks(
  pts: Map<number, { x: number; y: number }>
): Landmark[] {
  const lms: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0,
  }));
  for (const [index, pos] of pts) {
    lms[index] = { x: pos.x, y: pos.y, z: 0, visibility: 1 };
  }
  return lms;
}

function computeResults(pts: Map<number, { x: number; y: number }>) {
  const allPlaced = POINTS.every((p) => pts.has(p.index));
  if (!allPlaced) return null;

  const lms = buildLandmarks(pts);

  const leftAngle = calculateAngle(
    lms[LANDMARK.LEFT_SHOULDER],
    lms[LANDMARK.LEFT_ELBOW],
    lms[LANDMARK.LEFT_WRIST]
  );
  const rightAngle = calculateAngle(
    lms[LANDMARK.RIGHT_SHOULDER],
    lms[LANDMARK.RIGHT_ELBOW],
    lms[LANDMARK.RIGHT_WRIST]
  );

  const shoulderMidY =
    (lms[LANDMARK.LEFT_SHOULDER].y + lms[LANDMARK.RIGHT_SHOULDER].y) / 2;
  const wristMidY =
    (lms[LANDMARK.LEFT_WRIST].y + lms[LANDMARK.RIGHT_WRIST].y) / 2;
  const hipMidY =
    (lms[LANDMARK.LEFT_HIP].y + lms[LANDMARK.RIGHT_HIP].y) / 2;

  const wristsBelowShoulders = wristMidY > shoulderMidY;

  // Reject standing: hips way below shoulders relative to shoulder width
  const shoulderWidth = Math.abs(
    lms[LANDMARK.RIGHT_SHOULDER].x - lms[LANDMARK.LEFT_SHOULDER].x
  );
  const hipBelowShoulder = hipMidY - shoulderMidY;
  const hipShoulderRatio =
    shoulderWidth > 0 ? hipBelowShoulder / shoulderWidth : 0;
  const notStanding = hipShoulderRatio < 1.2;

  const inPosition = wristsBelowShoulders && notStanding;

  const bothDown =
    leftAngle < ANGLE_DOWN_THRESHOLD && rightAngle < ANGLE_DOWN_THRESHOLD;
  const bothUp =
    leftAngle > ANGLE_UP_THRESHOLD && rightAngle > ANGLE_UP_THRESHOLD;

  return {
    leftAngle: Math.round(leftAngle * 10) / 10,
    rightAngle: Math.round(rightAngle * 10) / 10,
    wristsBelowShoulders,
    notStanding,
    hipShoulderRatio: Math.round(hipShoulderRatio * 100) / 100,
    inPosition,
    bothDown,
    bothUp,
    wouldBePhase: bothDown ? ("DOWN" as const) : bothUp ? ("UP" as const) : ("TRANSITION" as const),
  };
}

export default function PlaygroundPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [points, setPoints] = useState<Map<number, { x: number; y: number }>>(
    () => new Map()
  );
  const [activeIdx, setActiveIdx] = useState<number>(POINTS[0].index);
  const [dragging, setDragging] = useState<number | null>(null);

  // --- Image loading ---
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPoints(new Map());
    setActiveIdx(POINTS[0].index);
  }, []);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  // --- Drawing ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const w = canvas.width;
    const h = canvas.height;

    // Skeleton connections
    ctx.lineCap = "round";
    for (const [i, j] of SKELETON_CONNECTIONS) {
      const a = points.get(i);
      const b = points.get(j);
      if (!a || !b) continue;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }

    // Landmarks
    for (const { index, color, label } of POINTS) {
      const p = points.get(index);
      if (!p) continue;
      const x = p.x * w;
      const y = p.y * h;
      const active = index === activeIdx;

      // Outer ring for active
      if (active) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, active ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = `bold ${Math.max(12, Math.round(w * 0.018))}px monospace`;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(label, x + 16, y + 5);
      ctx.shadowBlur = 0;
    }

    // Angle arcs at elbows
    const results = computeResults(points);
    if (results) {
      for (const { elbowIdx, shoulderIdx, wristIdx, angle } of [
        {
          elbowIdx: LANDMARK.LEFT_ELBOW,
          shoulderIdx: LANDMARK.LEFT_SHOULDER,
          wristIdx: LANDMARK.LEFT_WRIST,
          angle: results.leftAngle,
        },
        {
          elbowIdx: LANDMARK.RIGHT_ELBOW,
          shoulderIdx: LANDMARK.RIGHT_SHOULDER,
          wristIdx: LANDMARK.RIGHT_WRIST,
          angle: results.rightAngle,
        },
      ]) {
        const elbow = points.get(elbowIdx);
        const shoulder = points.get(shoulderIdx);
        const wrist = points.get(wristIdx);
        if (!elbow || !shoulder || !wrist) continue;

        const ex = elbow.x * w;
        const ey = elbow.y * h;

        // Angle label
        const isDown = angle < ANGLE_DOWN_THRESHOLD;
        const isUp = angle > ANGLE_UP_THRESHOLD;
        ctx.font = `bold ${Math.max(14, Math.round(w * 0.022))}px monospace`;
        ctx.fillStyle = isDown
          ? "#f87171"
          : isUp
            ? "#4ade80"
            : "#facc15";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 4;
        ctx.fillText(`${angle}°`, ex - 20, ey - 18);
        ctx.shadowBlur = 0;
      }
    }
  }, [points, activeIdx]);

  useEffect(() => {
    draw();
  }, [draw]);

  // --- Canvas interaction ---
  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const findNearby = (pos: { x: number; y: number }) => {
    let closest: number | null = null;
    let closestDist = 0.03;
    for (const [index, p] of points) {
      const d = Math.hypot(p.x - pos.x, p.y - pos.y);
      if (d < closestDist) {
        closest = index;
        closestDist = d;
      }
    }
    return closest;
  };

  const handlePointerDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    if (!pos) return;

    const nearby = findNearby(pos);
    if (nearby !== null) {
      setActiveIdx(nearby);
      setDragging(nearby);
    } else {
      // Place active landmark
      const next = new Map(points).set(activeIdx, pos);
      setPoints(next);
      setDragging(activeIdx);

      // Auto-advance to next unplaced
      const curI = POINTS.findIndex((p) => p.index === activeIdx);
      for (let i = 1; i <= POINTS.length; i++) {
        const np = POINTS[(curI + i) % POINTS.length];
        if (!next.has(np.index)) {
          setActiveIdx(np.index);
          break;
        }
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (dragging === null) return;
    const pos = getPos(e);
    if (!pos) return;
    setPoints((prev) => new Map(prev).set(dragging, pos));
  };

  const handlePointerUp = () => setDragging(null);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !touch) return;
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: (touch.clientX - rect.left) / rect.width,
      y: (touch.clientY - rect.top) / rect.height,
    };

    const nearby = findNearby(pos);
    if (nearby !== null) {
      setActiveIdx(nearby);
      setDragging(nearby);
    } else {
      const next = new Map(points).set(activeIdx, pos);
      setPoints(next);
      setDragging(activeIdx);
      const curI = POINTS.findIndex((p) => p.index === activeIdx);
      for (let i = 1; i <= POINTS.length; i++) {
        const np = POINTS[(curI + i) % POINTS.length];
        if (!next.has(np.index)) {
          setActiveIdx(np.index);
          break;
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging === null) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !touch) return;
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: (touch.clientX - rect.left) / rect.width,
      y: (touch.clientY - rect.top) / rect.height,
    };
    setPoints((prev) => new Map(prev).set(dragging, pos));
  };

  const results = computeResults(points);
  const placedCount = POINTS.filter((p) => points.has(p.index)).length;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/pushups" className="text-zinc-500 hover:text-white text-sm">
            &larr; back
          </a>
          <h1 className="text-xl font-bold font-mono">Pose Playground</h1>
          <span className="text-zinc-600 text-sm font-mono">
            {placedCount}/{POINTS.length} points
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Canvas */}
          <div className="flex-1 min-w-0">
            {!imageSrc ? (
              <label
                className="flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl h-80 md:h-[28rem] cursor-pointer hover:border-zinc-500 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <div className="text-center text-zinc-500 px-4">
                  <p className="text-4xl mb-3">+</p>
                  <p className="text-base">
                    Drop a push-up image or click to upload
                  </p>
                  <p className="text-sm mt-2 text-zinc-600">
                    Then click to place landmarks on the body
                  </p>
                </div>
              </label>
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-xl cursor-crosshair"
                  style={{ touchAction: "none" }}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handlePointerUp}
                />
                <button
                  onClick={() => {
                    setImageSrc((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return null;
                    });
                    imageRef.current = null;
                    setPoints(new Map());
                    setActiveIdx(POINTS[0].index);
                  }}
                  className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-zinc-400 hover:text-white rounded-lg px-3 py-1.5 text-xs font-mono"
                >
                  Change Image
                </button>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="lg:w-72 xl:w-80 space-y-4 flex-shrink-0">
            {/* Landmark selector */}
            <div className="bg-zinc-900 rounded-xl p-4">
              <h2 className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">
                Place landmarks (top &rarr; bottom)
              </h2>
              <div className="grid grid-cols-2 gap-1.5">
                {POINTS.map(({ index, label, color }) => {
                  const placed = points.has(index);
                  const active = index === activeIdx;
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveIdx(index)}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                        active
                          ? "ring-2 ring-white/80 bg-zinc-800"
                          : "hover:bg-zinc-800/60"
                      }`}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                        style={{
                          backgroundColor: placed ? color : "#444",
                        }}
                      />
                      <span
                        className={
                          placed ? "text-zinc-200" : "text-zinc-500"
                        }
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {points.size > 0 && (
                <button
                  onClick={() => {
                    setPoints(new Map());
                    setActiveIdx(POINTS[0].index);
                  }}
                  className="mt-3 w-full py-2 text-xs font-mono bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-400"
                >
                  Reset All Points
                </button>
              )}
            </div>

            {/* Detection results */}
            {results && (
              <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
                <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Detection Results
                </h2>

                {/* Angle gauges */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "L Elbow", angle: results.leftAngle },
                    { label: "R Elbow", angle: results.rightAngle },
                  ].map(({ label, angle }) => {
                    const pct = Math.max(
                      0,
                      Math.min(
                        100,
                        ((angle - ANGLE_DOWN_THRESHOLD) /
                          (ANGLE_UP_THRESHOLD - ANGLE_DOWN_THRESHOLD)) *
                          100
                      )
                    );
                    const clr =
                      angle < ANGLE_DOWN_THRESHOLD
                        ? "#f87171"
                        : angle > ANGLE_UP_THRESHOLD
                          ? "#4ade80"
                          : "#facc15";
                    return (
                      <div key={label} className="bg-zinc-800 rounded-lg p-3">
                        <div className="text-zinc-500 text-xs font-mono">
                          {label}
                        </div>
                        <div
                          className="text-2xl font-mono font-bold"
                          style={{ color: clr }}
                        >
                          {angle}°
                        </div>
                        <div className="mt-1.5 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: clr,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Position checks */}
                <div className="space-y-1.5 text-sm font-mono">
                  {[
                    {
                      label: "Wrists below shoulders",
                      ok: results.wristsBelowShoulders,
                    },
                    {
                      label: `Not standing (${results.hipShoulderRatio} < 1.2)`,
                      ok: results.notStanding,
                    },
                  ].map(({ label, ok }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-zinc-400 text-xs">{label}</span>
                      <span
                        className={`text-xs ${ok ? "text-green-400" : "text-red-400"}`}
                      >
                        {ok ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Phase */}
                <div className="pt-3 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-xs font-mono">
                      Position Valid
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${results.inPosition ? "text-green-400" : "text-red-400"}`}
                    >
                      {results.inPosition ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-zinc-500 text-xs font-mono">
                      Phase
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        results.wouldBePhase === "DOWN"
                          ? "text-red-400"
                          : results.wouldBePhase === "UP"
                            ? "text-green-400"
                            : "text-yellow-400"
                      }`}
                    >
                      {results.wouldBePhase}
                    </span>
                  </div>
                </div>

                {/* Thresholds reference */}
                <div className="pt-3 border-t border-zinc-800 text-xs font-mono text-zinc-600 space-y-0.5">
                  <div>
                    DOWN: both arms &lt; {ANGLE_DOWN_THRESHOLD}°
                  </div>
                  <div>
                    UP: both arms &gt; {ANGLE_UP_THRESHOLD}°
                  </div>
                </div>
              </div>
            )}

            {/* Instructions when no results */}
            {!results && imageSrc && (
              <div className="bg-zinc-900 rounded-xl p-4 text-sm font-mono text-zinc-500">
                <p>Click on the image to place each landmark.</p>
                <p className="mt-2">
                  Order: hips &rarr; shoulders &rarr; elbows &rarr; wrists
                </p>
                <p className="mt-2 text-zinc-600">
                  Drag any point to reposition it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
