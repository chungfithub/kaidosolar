import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: fetch top good memories for injection into system prompt
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic") || "";
  const limit = parseInt(searchParams.get("limit") || "5");

  try {
    const memories = await (prisma as any).aiMemory.findMany({
      where: {
        rating: { gte: 1 },
        ...(topic ? {
          OR: [
            { topic: { contains: topic } },
            { userInput: { contains: topic } },
          ]
        } : {})
      },
      orderBy: [
        { rating: "desc" },
        { usedCount: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json(memories);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: save a new memory or update rating
export async function POST(req: NextRequest) {
  try {
    const { topic, userInput, aiResponse, rating } = await req.json();

    if (!userInput || !aiResponse) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if similar memory already exists (avoid duplicates)
    const existing = await (prisma as any).aiMemory.findFirst({
      where: { userInput: { equals: userInput } }
    });

    if (existing) {
      // Update rating
      const updated = await (prisma as any).aiMemory.update({
        where: { id: existing.id },
        data: {
          rating: Math.max(-5, Math.min(5, existing.rating + (rating || 1))),
          usedCount: { increment: 1 },
        }
      });
      return NextResponse.json(updated);
    }

    const memory = await (prisma as any).aiMemory.create({
      data: {
        topic: topic || "general",
        userInput,
        aiResponse,
        rating: rating || 1,
      }
    });

    return NextResponse.json(memory);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: thumbs up/down on a message
export async function PATCH(req: NextRequest) {
  try {
    const { id, delta } = await req.json(); // delta: +1 or -1
    const memory = await (prisma as any).aiMemory.update({
      where: { id },
      data: { rating: { increment: delta } }
    });
    return NextResponse.json(memory);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
