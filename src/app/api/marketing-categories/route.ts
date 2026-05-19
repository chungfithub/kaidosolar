import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const categories = await (prisma as any).marketingCategory.findMany({
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const cat = await (prisma as any).marketingCategory.create({ data: { name } });
    return NextResponse.json(cat);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
