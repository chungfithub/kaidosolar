"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function updateCustomerProfile(customerId: number, formData: FormData) {
  const phone = formData.get("phone") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!password) {
    return { success: false, message: "Vui lòng nhập mật khẩu hiện tại để xác nhận thay đổi." };
  }

  try {
    const account = await prisma.customerAccount.findFirst({
      where: { customerId }
    });

    if (!account) {
      return { success: false, message: "Không tìm thấy thông tin đăng nhập." };
    }

    const isValid = await bcrypt.compare(password, account.passwordHash);
    if (!isValid) {
      return { success: false, message: "Mật khẩu xác nhận không chính xác." };
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { phone, name }
    });
    revalidatePath("/tai-khoan/cai-dat");
    revalidatePath("/tai-khoan");
    return { success: true, message: "Cập nhật thông tin cá nhân thành công!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Có lỗi xảy ra khi cập nhật hồ sơ." };
  }
}

export async function updateCustomerShipping(customerId: number, formData: FormData) {
  const shippingName = formData.get("shippingName") as string;
  const shippingPhone = formData.get("shippingPhone") as string;
  const shippingAddress = formData.get("shippingAddress") as string;

  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        shippingName,
        shippingPhone,
        shippingAddress
      }
    });
    revalidatePath("/tai-khoan/cai-dat");
    return { success: true, message: "Cập nhật sổ địa chỉ giao hàng thành công!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Có lỗi xảy ra khi cập nhật địa chỉ giao hàng." };
  }
}

export async function changeCustomerPassword(accountId: number, formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return { success: false, message: "Mật khẩu xác nhận không khớp." };
  }

  if (newPassword.length < 6) {
    return { success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }

  try {
    const account = await prisma.customerAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return { success: false, message: "Không tìm thấy tài khoản." };
    }

    const isValid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!isValid) {
      return { success: false, message: "Mật khẩu hiện tại không đúng." };
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.customerAccount.update({
      where: { id: accountId },
      data: { passwordHash: newHash }
    });

    return { success: true, message: "Đổi mật khẩu thành công!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Có lỗi xảy ra khi đổi mật khẩu." };
  }
}
