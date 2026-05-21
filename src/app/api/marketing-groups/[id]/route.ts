import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.membersCount) {
    body.lastSyncAt = new Date();
  }

  const { categoryIds, categoryId, ...rest } = body;
  const groupData: any = { ...rest };

  if (categoryIds !== undefined || categoryId !== undefined) {
    let finalCategoryIds: number[] = [];
    if (categoryIds && Array.isArray(categoryIds)) {
      finalCategoryIds = categoryIds.map((id: any) => typeof id === 'string' ? parseInt(id) : id).filter(Boolean);
    } else if (categoryId) {
      const parsed = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
      if (parsed) finalCategoryIds = [parsed];
    }

    groupData.categories = {
      set: finalCategoryIds.map(id => ({ id }))
    };
  }

  const group = await (prisma as any).marketingGroup.update({
    where: { id: parseInt(id) },
    data: groupData
  });

  if (body.membersCount) {
    await (prisma as any).marketingGroupHistory.create({
      data: {
        groupId: parseInt(id),
        membersCount: body.membersCount
      }
    });
  }

  return NextResponse.json(group);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await (prisma as any).marketingGroup.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
