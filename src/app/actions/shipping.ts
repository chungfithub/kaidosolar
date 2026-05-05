"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function saveShippingCarrier(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const routes = formData.get("routes") as string;
  const notes = formData.get("notes") as string;

  await prisma.shippingCarrier.create({
    data: {
      name,
      phone,
      routes,
      notes,
    }
  });

  revalidatePath("/admin/shipping");
  redirect("/admin/shipping");
}

export async function updateCarrier(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const routes = formData.get("routes") as string;
  const notes = formData.get("notes") as string;

  await prisma.shippingCarrier.update({
    where: { id },
    data: {
      name,
      phone,
      routes,
      notes,
    }
  });

  revalidatePath("/admin/shipping");
  redirect("/admin/shipping");
}

export async function deleteCarrier(id: number) {
  await prisma.shippingCarrier.delete({
    where: { id }
  });
  revalidatePath("/admin/shipping");
}

export async function deleteShippingCarrier(id: number) {
  await prisma.shippingCarrier.delete({ where: { id } });
  revalidatePath("/admin/shipping");
}
