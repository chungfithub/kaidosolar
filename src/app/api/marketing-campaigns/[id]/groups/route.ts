import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaignId = parseInt(id);
  const { groupIds } = await req.json(); // array of numbers

  if (!groupIds || !Array.isArray(groupIds)) {
    return NextResponse.json({ error: "Invalid groupIds" }, { status: 400 });
  }

  for (const groupId of groupIds) {
    try {
      await (prisma as any).marketingCampaignGroup.create({
        data: {
          campaignId,
          groupId
        }
      });
    } catch (error) {
      // ignore duplicates
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaignId = parseInt(id);
  
  // Can either receive groupIds in body or search params.
  // Using body for DELETE is valid in modern APIs but sometimes blocked.
  // Let's use search params or body.
  const url = new URL(req.url);
  const groupIdParam = url.searchParams.get("groupId");

  if (groupIdParam) {
    const groupId = parseInt(groupIdParam);
    await (prisma as any).marketingCampaignGroup.delete({
      where: {
        campaignId_groupId: {
          campaignId,
          groupId
        }
      }
    });
  } else {
    // try to get from body
    try {
      const { groupIds } = await req.json();
      if (groupIds && Array.isArray(groupIds)) {
        await (prisma as any).marketingCampaignGroup.deleteMany({
          where: {
            campaignId,
            groupId: { in: groupIds }
          }
        });
      }
    } catch(e) {
      // ignore
    }
  }

  return NextResponse.json({ success: true });
}
