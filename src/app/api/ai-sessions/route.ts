import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: list all sessions (newest first)
export async function GET() {
  try {
    const sessions = await (prisma as any).aiChatSession.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1, // just the first message for preview
        },
        _count: { select: { messages: true } }
      },
    });
    return NextResponse.json(sessions);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: create a new session
export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const session = await (prisma as any).aiChatSession.create({
      data: { title: title || "Cuộc trò chuyện mới" }
    });
    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
