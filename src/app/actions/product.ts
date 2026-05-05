"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function saveProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price = parseInt(formData.get("price") as string) || 0;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const category = formData.get("category") as string;
  const brand = formData.get("brand") as string;
  const capacity = formData.get("capacity") as string;
  const warranty = formData.get("warranty") as string;
  const specs = formData.get("specs") as string;
  const imagesStr = formData.get("images") as string; // JSON string array of URLs

  // Handle supplier prices parsing from hidden input
  const supplierPricesStr = formData.get("supplierPrices") as string;
  let supplierPrices: any[] = [];
  try {
    supplierPrices = JSON.parse(supplierPricesStr || "[]");
  } catch (e) { }

  if (id) {
    // Update
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price,
        category,
        brand,
        capacity,
        warranty,
        stock,
        specs,
        images: imagesStr,
        supplierPrices: {
          deleteMany: {}, // Simplest way to update relations: delete all and recreate
          create: supplierPrices.map(sp => ({
            supplierId: parseInt(sp.supplierId),
            importPrice: parseInt(sp.importPrice)
          }))
        }
      }
    });
  } else {
    // Create
    await prisma.product.create({
      data: {
        name,
        price,
        category,
        brand,
        capacity,
        warranty,
        stock,
        specs,
        images: imagesStr,
        supplierPrices: {
          create: supplierPrices.map(sp => ({
            supplierId: parseInt(sp.supplierId),
            importPrice: parseInt(sp.importPrice)
          }))
        }
      }
    });
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function getSuppliers() {
  return await prisma.supplier.findMany();
}

export async function saveBulkProducts(formData: FormData) {
  const productsStr = formData.get("products") as string;
  const globalSupplierId = formData.get("globalSupplierId") as string;
  if (!productsStr) return;

  try {
    const productsData = JSON.parse(productsStr);

    await prisma.$transaction(
      productsData.map((p: any) => {
        const productData: any = {
          name: p.name || "Sản phẩm mới",
          price: parseInt(p.price) || 0,
          stock: parseInt(p.stock) || 0,
          category: p.category || "panels",
          brand: p.brand || "",
          capacity: p.capacity || "",
          warranty: p.warranty || "",
          specs: p.specs || "",
          images: JSON.stringify(p.images || [])
        };

        if (globalSupplierId && p.importPrice) {
          productData.supplierPrices = {
            create: [{
              supplierId: parseInt(globalSupplierId),
              importPrice: parseInt(p.importPrice) || 0
            }]
          };
        }

        return prisma.product.create({
          data: productData
        });
      })
    );
  } catch (e) {
    console.error("Bulk save error:", e);
    throw e;
  }

  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({
    where: { id }
  });
  revalidatePath("/admin/products");
}
