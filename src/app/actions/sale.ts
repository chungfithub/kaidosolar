"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function createSale(formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const notes = formData.get("notes") as string;
  const itemsStr = formData.get("items") as string;

  const items: { productId: number; quantity: number; unitPrice: number }[] = JSON.parse(itemsStr || "[]");

  if (!customerName || items.length === 0) {
    throw new Error("Thiếu thông tin đơn hàng");
  }

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  await prisma.$transaction(async (tx) => {
    // Create the sale
    const sale = await tx.sale.create({
      data: {
        customerName,
        customerPhone,
        notes,
        totalAmount,
        status: "pending",
        items: {
          create: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          }))
        }
      }
    });

    // Deduct stock for each item
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    return sale;
  });

  revalidatePath("/admin/sales");
  redirect("/admin/sales");
}

export async function getSales() {
  return prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } }
      }
    }
  });
}

export async function updateSaleStatus(id: number, status: string) {
  await prisma.sale.update({ where: { id }, data: { status } });
  revalidatePath("/admin/sales");
}

export async function deleteSale(id: number) {
  // Restore stock before deleting
  const sale = await prisma.sale.findUnique({
    where: { id }, include: { items: true }
  });
  if (sale) {
    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }
      await tx.sale.delete({ where: { id } });
    });
  }
  revalidatePath("/admin/sales");
}
