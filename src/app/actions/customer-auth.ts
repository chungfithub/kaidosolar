"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signCustomerToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

const COOKIE_NAME = "customer_token";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
export async function registerCustomer(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!name || !phone || !email || !password) {
    return { success: false, error: "Vui lòng điền đầy đủ thông tin." };
  }
  if (password.length < 6) {
    return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }
  if (password !== confirm) {
    return { success: false, error: "Mật khẩu xác nhận không khớp." };
  }

  // Check email unique
  const existing = await prisma.customerAccount.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Email này đã được đăng ký. Vui lòng đăng nhập." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Find or create Customer record by phone (link existing orders)
  let customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name, phone, email, address: "" },
    });
  } else {
    // Update name/email on existing customer if missing
    if (!customer.email) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { email, name },
      });
    }
  }

  // Check if this customer already has an account
  const existingAccountForCustomer = await prisma.customerAccount.findUnique({
    where: { customerId: customer.id },
  });
  if (existingAccountForCustomer) {
    return { success: false, error: "Số điện thoại này đã được liên kết với tài khoản khác. Vui lòng đăng nhập." };
  }

  const account = await prisma.customerAccount.create({
    data: {
      email,
      passwordHash,
      customerId: customer.id,
    },
  });

  // Sign in immediately after register
  const token = await signCustomerToken({
    accountId: account.id,
    customerId: customer.id,
    email: account.email,
    name: customer.name,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTS);

  revalidatePath("/tai-khoan");
  redirect("/tai-khoan");
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export async function loginCustomer(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập email và mật khẩu." };
  }

  const account = await prisma.customerAccount.findUnique({
    where: { email },
    include: { customer: true },
  });

  if (!account) {
    return { success: false, error: "Email chưa được đăng ký." };
  }
  if (account.status !== "active") {
    return { success: false, error: "Tài khoản của bạn đã bị khóa." };
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    return { success: false, error: "Mật khẩu không đúng." };
  }

  const token = await signCustomerToken({
    accountId: account.id,
    customerId: account.customerId,
    email: account.email,
    name: account.customer?.name ?? email,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTS);

  redirect("/tai-khoan");
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export async function logoutCustomer() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/");
}
