"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function registerProject(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const name       = formData.get("name")        as string;
    const phone      = formData.get("phone")       as string;
    const address    = formData.get("address")     as string;
    const roofArea   = formData.get("roofArea")    as string;
    const budget     = formData.get("budget")      as string;
    const notes      = formData.get("notes")       as string;
    const systemType = formData.get("systemType")  as string;
    const monthlyBillStr = formData.get("monthlyBill") as string;
    const usageTime  = formData.get("usageTime")   as string;

    if (!name || !phone) {
      return { success: false, message: "Vui lòng điền đầy đủ thông tin." };
    }

    // ── Ưu tiên lấy customer từ session đăng nhập ───────────────────────────
    let customerId: number | null = null;
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (token) {
      const session = await verifyCustomerToken(token);
      if (session?.customerId) {
        customerId = session.customerId as number;
        await prisma.customer.update({
          where: { id: customerId },
          data: { name, address: address || undefined },
        });
      }
    }

    // ── Fallback: tìm/tạo Customer theo SĐT ─────────────────────────────────
    if (!customerId) {
      let customer = await prisma.customer.findFirst({ where: { phone } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { name, phone, address, email: "" },
        });
      }
      customerId = customer.id;
    }

    // ── Tạo Project với đầy đủ thông tin tư vấn ─────────────────────────────
    const projectName = `Dự án - ${name} - ${new Date().toLocaleDateString("vi-VN")}`;
    const monthlyBill = monthlyBillStr ? parseInt(monthlyBillStr.replace(/\D/g, ""), 10) || null : null;

    await prisma.project.create({
      data: {
        name:        projectName,
        customerId,
        status:      "draft",
        totalCost:   0,
        notes:       notes || null,
        systemType:  systemType || null,
        roofArea:    roofArea   || null,
        budget:      budget     || null,
        monthlyBill: monthlyBill,
        usageTime:   usageTime  || null,
      },
    });

    revalidatePath("/admin/projects");
    revalidatePath("/admin/customers");

    return { success: true, message: "Đăng ký thành công! Chúng tôi sẽ liên hệ bạn sớm nhất." };
  } catch (err) {
    console.error("registerProject error:", err);
    return { success: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }
}
