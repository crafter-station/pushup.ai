import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ShareActions } from "./share-actions";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  if (!session) return {};

  const title = `${session.count} Push Ups — FLEX.IA`;
  const description = `I just did ${session.count} push ups! Track your reps with computer vision.`;
  const ogUrl = `/api/og/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  if (!session) notFound();

  const date = new Date(session.createdAt);
  const formatted = date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  const totalSec = Math.floor(session.durationMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Subtle stripe bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)",
        }}
      />

      {/* FLEX.IA branding */}
      <span className="absolute top-4 right-5 sm:top-6 sm:right-8 z-10 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-grid">
        FLEX.IA
      </span>

      {/* Badge card */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
        {/* Screenshot */}
        {session.screenshot && (
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.screenshot}
              alt="Session screenshot"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-8xl sm:text-9xl font-bold tracking-tighter text-white">
            {session.count}
          </span>
          <span className="font-mono text-sm sm:text-base uppercase tracking-[0.3em] text-mid-gray">
            PUSH UPS
          </span>
        </div>

        {/* Duration & Date */}
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-annotation">
          {duration} &middot; {formatted}
        </div>

        {/* Share actions (client component) */}
        <ShareActions id={id} />

        {/* CTA */}
        <Link
          href="/pushups"
          className="px-8 py-2.5 border border-grid font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-mid-gray transition-colors hover:text-white hover:border-white"
        >
          TRY IT YOURSELF
        </Link>
      </div>
    </div>
  );
}
