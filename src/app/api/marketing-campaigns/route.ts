import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const campaigns = await (prisma as any).marketingCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { groups: true }
      },
      groups: {
        select: { groupId: true }
      }
    }
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const campaign = await (prisma as any).marketingCampaign.create({ data: body });
  return NextResponse.json(campaign);
}
