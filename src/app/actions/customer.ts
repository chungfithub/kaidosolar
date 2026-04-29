"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function saveCustomer(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;

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
