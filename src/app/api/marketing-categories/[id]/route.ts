import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await (prisma as any).marketingCategory.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
