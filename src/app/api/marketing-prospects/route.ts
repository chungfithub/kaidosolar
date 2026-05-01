import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Dùng raw query để bỏ qua lỗi Prisma Client chưa update model
    const prospects = await (prisma as any).$queryRawUnsafe(
      `SELECT * FROM MarketingProspect ORDER BY createdAt DESC`
    );
    return NextResponse.json(prospects);
  } catch (error: any) {
    console.error("GET Marketing Prospects Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    
    // Dùng executeRaw để insert trực tiếp
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO MarketingProspect (name, platform, url, phone, notes, status, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      body.name, 
      body.platform, 
      body.url || null, 
      body.phone || null, 
      body.notes || null, 
      body.status || 'new',
      now,
      now
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Marketing Prospects Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
