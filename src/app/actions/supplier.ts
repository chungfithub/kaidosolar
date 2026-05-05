"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function saveSupplier(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const regions = formData.get("regions") as string;
  const facebook = formData.get("facebook") as string;
  const zalo = formData.get("zalo") as string;
  const notes = formData.get("notes") as string;

  await prisma.supplier.create({
    data: {
      name,
      phone,
      address,
      regions,
      facebook,
      zalo,
      notes,
    }
  });

  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function updateSupplier(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const regions = formData.get("regions") as string;
  const facebook = formData.get("facebook") as string;
  const zalo = formData.get("zalo") as string;
  const notes = formData.get("notes") as string;

  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      phone,
      address,
      regions,
      facebook,
      zalo,
      notes,
    }
  });

  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function deleteSupplier(id: number) {
  await prisma.supplier.delete({
    where: { id }
  });
  revalidatePath("/admin/suppliers");
}
