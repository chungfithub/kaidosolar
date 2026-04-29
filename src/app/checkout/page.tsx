import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import CheckoutClient from "./CheckoutClient";

const prisma = new PrismaClient();

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  let prefill: { name: string; phone: string; address: string } | null = null;
  let isLoggedIn = false;

  if (token) {
    const session = await verifyCustomerToken(token);
    if (session?.customerId) {
      isLoggedIn = true;
      const customer = await prisma.customer.findUnique({
        where: { id: session.customerId as number },
        select: { name: true, phone: true, address: true },
      });
      if (customer) {
        prefill = {
          name: customer.name,
          phone: customer.phone,
          address: customer.address ?? "",
        };
      }
    }
  }

  return <CheckoutClient prefill={prefill} isLoggedIn={isLoggedIn} />;
}
