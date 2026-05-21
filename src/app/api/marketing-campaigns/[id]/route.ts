import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaign = await (prisma as any).marketingCampaign.findUnique({
    where: { id: parseInt(id) },
    include: {
      groups: {
        include: {
          group: {
            include: {
              categories: true,
              history: { orderBy: { recordedAt: 'asc' } }
            }
          }
        }
      }
    }
  });
  return NextResponse.json(campaign);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const campaign = await (prisma as any).marketingCampaign.update({
    where: { id: parseInt(id) },
    data: body
  });
  return NextResponse.json(campaign);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await (prisma as any).marketingCampaign.delete({
    where: { id: parseInt(id) }
  });
  return NextResponse.json({ success: true });
}
