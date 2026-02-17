import { PushUpSession } from "@/components/camera/push-up-session";
import Link from "next/link";

export default function PushUpsPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Back link */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-20 font-mono text-xs text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
      >
        &larr; BACK
      </Link>

      {/* Session */}
      <PushUpSession />
    </div>
  );
}
