"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

/** Tạo tài khoản web cho Customer đã có trong hệ thống */
export async function createAccountForCustomer(
  customerId: number,
  tempPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!tempPassword || tempPassword.length < 6) {
    return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { account: true },
  });

  if (!customer) {
    return { success: false, error: "Không tìm thấy khách hàng." };
  }
  if (customer.account) {
    return { success: false, error: "Khách hàng này đã có tài khoản web." };
  }
  if (!customer.email) {
    return { success: false, error: "Khách hàng chưa có email. Vui lòng cập nhật email trước." };
  }

  // Check email not taken by another account
  const existingEmail = await prisma.customerAccount.findUnique({
    where: { email: customer.email },
  });
  if (existingEmail) {
    return { success: false, error: `Email ${customer.email} đã được dùng bởi tài khoản khác.` };
  }

  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.customerAccount.create({
    data: {
      email: customer.email,
      passwordHash,
      customerId: customer.id,
      status: "active",
    },
  });

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  return { success: true };
}

/** Kích hoạt hoặc khóa tài khoản web */
export async function toggleAccountStatus(
  accountId: number
): Promise<{ success: boolean; newStatus?: string; error?: string }> {
  const account = await prisma.customerAccount.findUnique({
    where: { id: accountId },
  });
  if (!account) {
    return { success: false, error: "Không tìm thấy tài khoản." };
  }

  const newStatus = account.status === "active" ? "inactive" : "active";
  await prisma.customerAccount.update({
    where: { id: accountId },
    data: { status: newStatus },
  });

  revalidatePath(`/admin/customers/${account.customerId}`);
  revalidatePath("/admin/customers");
  return { success: true, newStatus };
}

/** Gỡ liên kết tài khoản web khỏi Customer (giữ account, xóa liên kết) */
export async function unlinkAccount(
  accountId: number,
  customerId: number
): Promise<{ success: boolean; error?: string }> {
  await prisma.customerAccount.update({
    where: { id: accountId },
    data: { customerId: null },
  });

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  return { success: true };
}

/** Sửa thông tin khách hàng */
export async function updateCustomerInfo(
  customerId: number,
  data: { name: string; phone: string; email: string; address: string }
): Promise<{ success: boolean; error?: string }> {
  await prisma.customer.update({
    where: { id: customerId },
    data,
  });

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  return { success: true };
}

/** Xóa khách hàng (cascade xóa orders, projects, account) */
export async function deleteCustomerById(
  customerId: number
): Promise<{ success: boolean; error?: string }> {
  await prisma.customer.delete({ where: { id: customerId } });
  revalidatePath("/admin/customers");
  return { success: true };
}
