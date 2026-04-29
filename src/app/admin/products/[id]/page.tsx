import ProductForm from "../ProductForm";
import { PrismaClient } from "@prisma/client";
import { getSuppliers } from "@/app/actions/product";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  
  if (isNaN(id)) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      supplierPrices: true
    }
  });

  if (!product) {
    notFound();
  }

  const suppliers = await getSuppliers();

  return <ProductForm product={product} suppliers={suppliers} />;
}
