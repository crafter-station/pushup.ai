import Link from "next/link";
import { LenticularStripes } from "@/components/ui/lenticular-stripes";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <LenticularStripes />

      {/* Brand watermark */}
      <span className="absolute top-4 right-5 sm:top-6 sm:right-8 z-10 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-grid">
        FLEX.IA
      </span>

      {/* Scattered spatial typography — centered cluster */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="relative w-[280px] h-[320px] sm:w-[420px] sm:h-[400px]">
          <span className="absolute font-mono text-[10px] sm:text-sm uppercase tracking-[0.5em] text-light-gray top-0 left-0">
            SHALL WE
          </span>

          <span className="absolute font-mono text-xl sm:text-3xl uppercase font-bold text-mid-gray top-[12%] right-0">
            COUNT
          </span>

          <span className="absolute font-mono text-sm sm:text-base uppercase tracking-[0.3em] text-light-gray top-[30%] left-[5%]">
            YOUR
          </span>

          {/* Central asterisk focal point */}
          <span
            className="absolute font-mono text-6xl sm:text-8xl text-white left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2"
            style={{ textShadow: "0 0 40px rgba(255,255,255,0.15)" }}
          >
            ✳
          </span>

          <span className="absolute font-mono text-3xl sm:text-5xl uppercase font-bold text-white top-[55%] right-0">
            PUSH
          </span>

          <span className="absolute font-mono text-2xl sm:text-4xl uppercase text-mid-gray top-[72%] left-0">
            UPS?
          </span>
        </div>

        {/* Bottom section */}
        <div className="absolute bottom-12 sm:bottom-16 left-0 right-0 flex flex-col items-center gap-5">
          <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-annotation text-center max-w-[260px] sm:max-w-xs px-4">
            START YOUR SESSION AND TRANSFORM YOUR BODY WITH COMPUTER VISION.
          </p>
          <Link
            href="/pushups"
            className="px-8 py-2.5 border border-grid font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-mid-gray transition-colors hover:text-white hover:border-white"
          >
            START
          </Link>
        </div>
      </div>
    </div>
  );
}
