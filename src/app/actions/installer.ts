"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function saveInstaller(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const regions = formData.get("regions") as string;
  const notes = formData.get("notes") as string;

  await prisma.installer.create({
    data: {
      name,
      phone,
      regions,
      notes,
    }
  });

  revalidatePath("/admin/installers");
  redirect("/admin/installers");
}

export async function updateInstaller(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const regions = formData.get("regions") as string;
  const notes = formData.get("notes") as string;

  await prisma.installer.update({
    where: { id },
    data: {
      name,
      phone,
      regions,
      notes,
    }
  });

  revalidatePath("/admin/installers");
  redirect("/admin/installers");
}

export async function deleteInstaller(id: number) {
  await prisma.installer.delete({
    where: { id }
  });
  revalidatePath("/admin/installers");
}
