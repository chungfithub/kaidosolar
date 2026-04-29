"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function createStockImport(formData: FormData) {
  const productId = parseInt(formData.get("productId") as string);
  const supplierId = formData.get("supplierId") ? parseInt(formData.get("supplierId") as string) : null;
  const quantity = parseInt(formData.get("quantity") as string) || 0;
  const importPrice = parseInt(formData.get("importPrice") as string) || 0;
  const note = formData.get("note") as string;

  if (!productId || quantity <= 0) {
    throw new Error("Sản phẩm và số lượng không hợp lệ");
  }

  // 1. Create StockImport
  await prisma.stockImport.create({
    data: {
      productId,
      supplierId,
      quantity,
      importPrice,
      note
    }
  });

  // 2. Increment Product stock
  await prisma.product.update({
    where: { id: productId },
    data: {
      stock: {
        increment: quantity
      }
    }
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}

export async function getInventoryStats() {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    include: {
      supplierPrices: true
    }
  });

  let totalItems = 0;
  let totalValue = 0;

  products.forEach(p => {
    totalItems += p.stock;
    
    // Estimate value using the first supplier price if available, otherwise just use price (or 0)
    let costPrice = 0;
    if (p.supplierPrices && p.supplierPrices.length > 0) {
      costPrice = p.supplierPrices[0].importPrice;
    }
    
    totalValue += (p.stock * costPrice);
  });

  return { totalItems, totalValue, products };
}
