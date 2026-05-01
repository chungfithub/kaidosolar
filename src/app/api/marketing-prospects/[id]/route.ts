import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const now = new Date().toISOString();

    // Xây dựng câu lệnh UPDATE động
    const fields = Object.keys(body).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => body[f]);
    
    await (prisma as any).$executeRawUnsafe(
      `UPDATE MarketingProspect SET ${setClause}, updatedAt = ? WHERE id = ?`,
      ...values,
      now,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH Marketing Prospect Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await (prisma as any).$executeRawUnsafe(
      `DELETE FROM MarketingProspect WHERE id = ?`,
      id
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Marketing Prospect Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
