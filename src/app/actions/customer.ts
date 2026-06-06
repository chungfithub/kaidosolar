"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function saveCustomer(formData: FormData) {
  const name = (formData.get("name") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim();
  const email = (formData.get("email") as string || "").trim();
  const address = (formData.get("address") as string || "").trim();

  await prisma.customer.create({
    data: {
      name,
      phone,
      email,
      address
    }
  });

  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}
