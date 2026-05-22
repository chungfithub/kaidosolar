import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await (prisma as any).marketingCategory.findMany();
    const groups = await (prisma as any).marketingGroup.findMany({
      include: {
        categories: true,
        history: true
      }
    });
    return NextResponse.json({ categories, groups });
  } catch (e: any) {
    console.error("Export Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serverUrl } = body;

    if (!serverUrl) {
      return NextResponse.json({ error: "Thiếu địa chỉ serverUrl!" }, { status: 400 });
    }

    // 1. Lấy dữ liệu local
    const categories = await (prisma as any).marketingCategory.findMany();
    const groups = await (prisma as any).marketingGroup.findMany({
      include: {
        categories: true,
        history: true
      }
    });

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Local GEMINI_API_KEY chưa được cấu hình trong file .env!" }, { status: 500 });
    }

    // 2. Gọi API đồng bộ của server sản xuất
    const response = await fetch(`${serverUrl}/api/marketing-groups/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${geminiApiKey}`
      },
      body: JSON.stringify({ categories, groups })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({ error: "Lỗi máy chủ không xác định" }));
      return NextResponse.json({ error: errorJson.error || `Server trả về lỗi: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (e: any) {
    console.error("Push Sync Error:", e);
    return NextResponse.json({ error: `Lỗi kết nối đến server: ${e.message}` }, { status: 500 });
  }
}
