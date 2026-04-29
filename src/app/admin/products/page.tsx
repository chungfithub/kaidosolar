import { PrismaClient } from "@prisma/client";
import ProductTable from "./ProductTable";
import ProductsHeader from "./ProductsHeader";

const prisma = new PrismaClient();

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      supplierPrices: {
        include: {
          supplier: true
        }
      }
    },
    orderBy: { id: 'desc' }
  });

  return (
    <div className="panel active">
      <ProductsHeader />

      <div className="table-container">
        <ProductTable initialProducts={products} />
      </div>
    </div>
  );
}
