import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  if (!session) {
    return new Response("Not found", { status: 404 });
  }

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

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          color: "#ffffff",
          fontFamily: "monospace",
          position: "relative",
          padding: "60px",
        }}
      >
        {/* Subtle stripe pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)",
            display: "flex",
          }}
        />

        {/* FLEX.IA branding */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "40px",
            fontSize: "10px",
            letterSpacing: "0.4em",
            color: "#3a3a3a",
            display: "flex",
          }}
        >
          FLEX.IA
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "60px",
            flex: 1,
          }}
        >
          {/* User screenshot */}
          {session.screenshot ? (
            <img
              src={session.screenshot}
              width={220}
              height={220}
              style={{
                borderRadius: "16px",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.1)",
              }}
            />
          ) : (
            <div
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "16px",
                backgroundColor: "#1a1a1a",
                border: "2px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                color: "#3a3a3a",
              }}
            >
              ?
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                fontSize: "140px",
                fontWeight: "bold",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                display: "flex",
              }}
            >
              {session.count}
            </div>
            <div
              style={{
                fontSize: "20px",
                letterSpacing: "0.3em",
                color: "#8a8a8a",
                display: "flex",
              }}
            >
              PUSH UPS
            </div>
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "0.2em",
                color: "#6b6b6b",
                marginTop: "12px",
                display: "flex",
              }}
            >
              {duration} &middot; {formatted}
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: "60px",
            fontSize: "12px",
            letterSpacing: "0.2em",
            color: "#3a3a3a",
            display: "flex",
          }}
        >
          pushup.ai
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
