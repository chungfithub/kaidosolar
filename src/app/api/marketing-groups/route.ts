import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const groups = await (prisma as any).marketingGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      category: true,
      history: { orderBy: { recordedAt: 'asc' } }
    }
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const group = await (prisma as any).marketingGroup.create({ data: body });
  
  if (body.membersCount) {
    await (prisma as any).marketingGroupHistory.create({
      data: {
        groupId: group.id,
        membersCount: body.membersCount
      }
    });
  }
  return NextResponse.json(group);
}
