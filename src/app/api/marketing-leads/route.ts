import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where = status && status !== "all" ? { status } : {};
  const leads = await (prisma as any).marketingLead.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const lead = await (prisma as any).marketingLead.create({ data: body });
  return NextResponse.json(lead);
}
