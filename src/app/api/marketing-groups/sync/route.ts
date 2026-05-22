import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Xác thực khóa bảo mật từ Header
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  
  const serverKey = process.env.GEMINI_API_KEY;
  if (!serverKey || token !== serverKey) {
    return NextResponse.json({ error: "Unauthorized. Khóa bảo mật không khớp hoặc chưa được cấu hình!" }, { status: 401 });
  }

  try {
    const { categories, groups } = await req.json();

    // 1. Đồng bộ Danh mục (MarketingCategory)
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        await (prisma as any).marketingCategory.upsert({
          where: { name: cat.name },
          update: {}, // Không thay đổi nếu đã tồn tại
          create: { name: cat.name }
        });
      }
    }

    // 2. Đồng bộ Nhóm & Lịch sử
    let syncedGroupsCount = 0;
    let syncedHistoryCount = 0;

    if (groups && Array.isArray(groups)) {
      for (const group of groups) {
        // Đồng bộ/Thêm mới Group
        await (prisma as any).marketingGroup.upsert({
          where: { id: group.id },
          update: {
            name: group.name,
            platform: group.platform,
            url: group.url,
            membersCount: group.membersCount,
            description: group.description,
            privacy: group.privacy,
            status: group.status,
            syncFrequency: group.syncFrequency,
            lastSyncAt: group.lastSyncAt ? new Date(group.lastSyncAt) : null,
            categories: {
              set: [], // Xóa các quan hệ cũ
              connect: group.categories.map((c: any) => ({ name: c.name })) // Kết nối lại theo tên danh mục
            }
          },
          create: {
            id: group.id,
            name: group.name,
            platform: group.platform,
            url: group.url,
            membersCount: group.membersCount,
            description: group.description,
            privacy: group.privacy,
            status: group.status,
            syncFrequency: group.syncFrequency,
            lastSyncAt: group.lastSyncAt ? new Date(group.lastSyncAt) : null,
            categories: {
              connect: group.categories.map((c: any) => ({ name: c.name }))
            }
          }
        });
        syncedGroupsCount++;

        // Đồng bộ Lịch sử tăng trưởng (History) cho từng Group
        if (group.history && Array.isArray(group.history)) {
          // Xóa toàn bộ lịch sử cũ của Group này để tránh trùng lặp
          await (prisma as any).marketingGroupHistory.deleteMany({
            where: { groupId: group.id }
          });

          // Thêm lại lịch sử tăng trưởng mới
          for (const h of group.history) {
            await (prisma as any).marketingGroupHistory.create({
              data: {
                groupId: group.id,
                membersCount: h.membersCount,
                recordedAt: new Date(h.recordedAt)
              }
            });
            syncedHistoryCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đồng bộ thành công! Đã cập nhật ${syncedGroupsCount} nhóm và ${syncedHistoryCount} bản ghi lịch sử.`
    });

  } catch (e: any) {
    console.error("Sync Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
