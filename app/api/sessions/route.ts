import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, insertSessionSchema } from "@/lib/db/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = insertSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid session data" },
      { status: 400 }
    );
  }

  const [session] = await db
    .insert(sessions)
    .values({
      count: parsed.data.count!,
      durationMs: parsed.data.durationMs!,
      screenshot: parsed.data.screenshot,
    })
    .returning({ id: sessions.id });

  return NextResponse.json({ id: session.id }, { status: 201 });
}
