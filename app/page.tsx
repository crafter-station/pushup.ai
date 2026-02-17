import Link from "next/link";
import { LenticularStripes } from "@/components/ui/lenticular-stripes";
import { CrafterStationLogo } from "@/components/logos/crafter-station";

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
          <div className="flex items-center gap-4 mt-2">
            <a
              href="https://github.com/crafter-station/pushup.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-grid hover:text-white transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://crafterstation.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-grid hover:text-white transition-colors"
            >
              <CrafterStationLogo className="h-4 w-auto" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
