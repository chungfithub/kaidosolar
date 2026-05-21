import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const groups = await (prisma as any).marketingGroup.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      categories: true,
      history: { orderBy: { recordedAt: 'asc' } }
    }
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { categoryIds, categoryId, ...rest } = body;
  
  const groupData: any = { ...rest };
  
  let finalCategoryIds: number[] = [];
  if (categoryIds && Array.isArray(categoryIds)) {
    finalCategoryIds = categoryIds.map((id: any) => typeof id === 'string' ? parseInt(id) : id).filter(Boolean);
  } else if (categoryId) {
    const parsed = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
    if (parsed) finalCategoryIds = [parsed];
  }

  if (finalCategoryIds.length > 0) {
    groupData.categories = {
      connect: finalCategoryIds.map(id => ({ id }))
    };
  }

  const group = await (prisma as any).marketingGroup.create({ 
    data: groupData,
    include: { categories: true }
  });
  
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
