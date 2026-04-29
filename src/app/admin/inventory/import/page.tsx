import { PrismaClient } from "@prisma/client";
import ImportForm from "./ImportForm";

const prisma = new PrismaClient();

export default async function ImportPage() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true, stock: true, supplierPrices: true }
  });

  const suppliers = await prisma.supplier.findMany({
    select: { id: true, name: true }
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '20px' }}>📥</span>
          Tạo Phiếu Nhập Kho
        </h1>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-header">
          Thông tin phiếu nhập
        </div>
        <div style={{ padding: '24px' }}>
          <ImportForm products={products} suppliers={suppliers} />
        </div>
      </div>
    </div>
  );
}
