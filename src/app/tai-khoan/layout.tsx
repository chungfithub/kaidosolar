import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutCustomer } from "@/app/actions/customer-auth";
import Link from "next/link";

import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function TaiKhoanLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/dang-nhap");
  const session = await verifyCustomerToken(token);
  if (!session) redirect("/dang-nhap");

  return <DashboardLayoutClient session={session} logoutAction={logoutCustomer}>{children}</DashboardLayoutClient>;
}
