import { cookies } from "next/headers";
import { verifyCustomerToken, verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutCustomer } from "@/app/actions/customer-auth";
import Link from "next/link";

import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function TaiKhoanLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  const adminToken = cookieStore.get("admin_token")?.value;

  let session = null;
  if (token) {
    session = await verifyCustomerToken(token);
  }

  let adminSession = null;
  if (adminToken) {
    adminSession = await verifyToken(adminToken);
  }

  if (!session && !adminSession) {
    redirect("/dang-nhap");
  }

  const displaySession = session || {
    name: (adminSession as any)?.username || "Admin",
    email: (adminSession as any)?.email || "admin@kaidosolar.com",
    customerId: null
  };

  return <DashboardLayoutClient session={displaySession} logoutAction={logoutCustomer}>{children}</DashboardLayoutClient>;
}
