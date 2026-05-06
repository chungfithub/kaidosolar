import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

const prisma = new PrismaClient();

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    redirect("/dang-nhap");
  }

  const decoded = await verifyCustomerToken(token);
  if (!decoded) {
    redirect("/dang-nhap");
  }

  // Lấy chi tiết tài khoản và thông tin khách hàng
  const account = await prisma.customerAccount.findUnique({
    where: { id: decoded.accountId },
    include: { customer: true }
  });

  if (!account || !account.customer) {
    redirect("/dang-nhap");
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", color: "var(--text)", marginBottom: "8px", fontWeight: 700 }}>
        ⚙️ Cài đặt tài khoản
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "0.95rem" }}>
        Cập nhật thông tin liên hệ và mật khẩu bảo mật của bạn.
      </p>

      <SettingsClient 
        customer={account.customer} 
        accountId={account.id} 
      />
    </div>
  );
}
