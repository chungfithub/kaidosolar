import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const groups = await (prisma as any).marketingGroup.findMany({
      orderBy: { createdAt: "asc" }
    });

    const urlMap = new Map<string, any[]>();
    const nameMap = new Map<string, any[]>();

    // Nhóm theo URL đã chuẩn hóa trước, sau đó nhóm theo Tên (nếu không có URL)
    for (const g of groups) {
      if (g.url && g.url.trim().startsWith("http")) {
        // Chuẩn hóa URL: loại bỏ dấu gạch chéo cuối, chuyển sang chữ thường, loại bỏ www.
        let normUrl = g.url.trim().toLowerCase().replace(/\/$/, "");
        normUrl = normUrl.replace("://www.", "://");
        if (!urlMap.has(normUrl)) {
          urlMap.set(normUrl, []);
        }
        urlMap.get(normUrl)!.push(g);
      } else if (g.name) {
        const normName = g.name.trim().toLowerCase();
        if (!nameMap.has(normName)) {
          nameMap.set(normName, []);
        }
        nameMap.get(normName)!.push(g);
      }
    }

    const idsToDelete: number[] = [];

    // Thu thập ID trùng lặp theo URL
    for (const [url, dupList] of urlMap.entries()) {
      if (dupList.length > 1) {
        // Sắp xếp: Ưu tiên giữ lại nhóm có số lượng thành viên lớn hơn, sau đó là nhóm tạo trước (id nhỏ hơn)
        dupList.sort((a, b) => {
          const membersA = a.membersCount || 0;
          const membersB = b.membersCount || 0;
          if (membersB !== membersA) {
            return membersB - membersA;
          }
          return a.id - b.id;
        });

        // Phần tử đầu tiên (index 0) được giữ lại, các phần tử từ index 1 trở đi sẽ bị xóa
        for (let i = 1; i < dupList.length; i++) {
          idsToDelete.push(dupList[i].id);
        }
      }
    }

    // Thu thập ID trùng lặp theo Tên (chỉ áp dụng cho nhóm không có URL)
    for (const [name, dupList] of nameMap.entries()) {
      if (dupList.length > 1) {
        dupList.sort((a, b) => {
          const membersA = a.membersCount || 0;
          const membersB = b.membersCount || 0;
          if (membersB !== membersA) {
            return membersB - membersA;
          }
          return a.id - b.id;
        });
        for (let i = 1; i < dupList.length; i++) {
          idsToDelete.push(dupList[i].id);
        }
      }
    }

    if (idsToDelete.length > 0) {
      await (prisma as any).marketingGroup.deleteMany({
        where: {
          id: { in: idsToDelete }
        }
      });
    }

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      message: idsToDelete.length > 0 
        ? `Đã dọn dẹp và xóa thành công ${idsToDelete.length} nhóm trùng lặp!`
        : "Không tìm thấy nhóm trùng lặp nào."
    });
  } catch (e: any) {
    console.error("Clean duplicates error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
