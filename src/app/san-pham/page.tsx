import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import SanPhamClient from "./SanPhamClient";

const prisma = new PrismaClient();

export const metadata = {
  title: "Sản Phẩm | Kaido Solar",
  description: "Thiết bị điện mặt trời chính hãng: tấm pin, biến tần, pin lưu trữ, phụ kiện lắp đặt từ các thương hiệu hàng đầu thế giới.",
};

export default async function SanPhamPage({
  searchParams,
}: {
  searchParams: Promise<{ "danh-muc"?: string }>;
}) {
  const sp = await searchParams;
  const danhMuc = sp["danh-muc"] ?? "all";

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Check customer session for navbar
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  let customerSession: { name: string; email: string } | null = null;
  if (token) {
    const session = await verifyCustomerToken(token);
    if (session) customerSession = { name: session.name, email: session.email };
  }

  return (
    <SanPhamClient
      products={products}
      initialCategory={danhMuc}
      customerSession={customerSession}
    />
  );
}
