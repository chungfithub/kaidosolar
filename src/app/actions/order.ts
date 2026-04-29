"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function submitQuoteRequest(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const email = ""; // Optional

  // 1. Create or Find Customer
  let customer = await prisma.customer.findFirst({
    where: { phone }
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: { name, phone, address, email }
    });
  }

  // 2. Create Order (Quote Request)
  const orderCode = `DH${Date.now().toString().slice(-6)}`;
  
  await prisma.order.create({
    data: {
      orderCode,
      customerId: customer.id,
      total: 0, // Need quote
      status: "pending"
    }
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  
  return { success: true, message: "Yêu cầu của bạn đã được gửi thành công!" };
}

export interface CartItemPayload {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export async function placeOrder(
  customerData: { name: string; phone: string; address: string; notes: string },
  cartItems: CartItemPayload[]
): Promise<{ success: boolean; orderCode?: string; error?: string }> {
  try {
    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: "Giỏ hàng trống" };
    }

    const { name, phone, address, notes } = customerData;
    if (!name || !phone) {
      return { success: false, error: "Vui lòng điền đầy đủ thông tin" };
    }

    // ── 1. Ưu tiên lấy customer từ session đăng nhập ──────────────────────
    let customerId: number | null = null;

    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (token) {
      const session = await verifyCustomerToken(token);
      if (session?.customerId) {
        customerId = session.customerId as number;
        // Cập nhật thông tin địa chỉ mới nhất
        await prisma.customer.update({
          where: { id: customerId },
          data: { name, address: address || undefined },
        });
      }
    }

    // ── 2. Nếu không đăng nhập → tìm/tạo Customer theo SĐT ───────────────
    if (!customerId) {
      let customer = await prisma.customer.findFirst({ where: { phone } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { name, phone, address, email: "" },
        });
      } else {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { name, address },
        });
      }
      customerId = customer.id;
    }

    // ── 3. Tính tổng & tạo đơn hàng ──────────────────────────────────────
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderCode = `DH${Date.now().toString().slice(-8)}`;

    await prisma.order.create({
      data: {
        orderCode,
        customerId,
        total,
        status: "pending",
        notes: notes || null,
        items: {
          create: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        },
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");
    revalidatePath("/tai-khoan/don-hang");

    return { success: true, orderCode };
  } catch (err: any) {
    console.error("placeOrder error:", err);
    return { success: false, error: "Có lỗi xảy ra, vui lòng thử lại." };
  }
}


