import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const prospects = await (prisma as any).marketingProspect.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(prospects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prospect = await (prisma as any).marketingProspect.create({ data: body });
    return NextResponse.json(prospect);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
