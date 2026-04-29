import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import RetailClient from "./RetailClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function Home() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  // Check customer session
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  let customerSession: { name: string; email: string } | null = null;
  if (token) {
    const session = await verifyCustomerToken(token);
    if (session) {
      customerSession = { name: session.name, email: session.email };
    }
  }

  return <RetailClient products={products} customerSession={customerSession} />;
}
