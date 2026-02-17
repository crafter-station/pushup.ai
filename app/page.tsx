import Link from "next/link";
import { IsometricGrid } from "@/components/ui/isometric-grid";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <IsometricGrid />

      {/* Central diamond content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div
          className="bg-white flex flex-col items-center justify-center gap-6 p-16"
          style={{
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            width: "min(420px, 80vw)",
            aspectRatio: "1",
          }}
        >
          <h1 className="text-black font-bold text-2xl tracking-tight uppercase text-center">
            FLEX.IA
          </h1>
          <p className="text-black/40 font-mono text-[8px] text-center max-w-[160px] leading-relaxed">
            BIOMECHANICS POSTURE CORRECTION REAL-TIME POSE ESTIMATION
          </p>
          <Link
            href="/pushups"
            className="mt-2 px-8 py-2 bg-black text-white font-mono text-xs uppercase tracking-[0.3em] hover:bg-black/80 transition-colors"
          >
            START
          </Link>
        </div>
      </div>
    </div>
  );
}
