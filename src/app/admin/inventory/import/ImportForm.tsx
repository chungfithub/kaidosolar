"use client";

import { useState } from "react";
import { createStockImport } from "@/app/actions/inventory";
import { useRouter } from "next/navigation";

export default function ImportForm({ products, suppliers }: { products: any[], suppliers: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [importPrice, setImportPrice] = useState("");
  const router = useRouter();

  const updateImportPrice = (pId: string, sId: string) => {
    if (!pId) {
      setImportPrice("");
      return;
    }
    
    const product = products.find(p => p.id.toString() === pId);
    if (!product || !product.supplierPrices) return;

    if (sId) {
      const sp = product.supplierPrices.find((sp: any) => sp.supplierId.toString() === sId);
      if (sp) {
        setImportPrice(parseInt(sp.importPrice).toLocaleString("en-US"));
        return;
      }
    }
    
    if (product.supplierPrices.length > 0) {
      setImportPrice(parseInt(product.supplierPrices[0].importPrice).toLocaleString("en-US"));
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProductId(pId);
    updateImportPrice(pId, selectedSupplierId);
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedSupplierId(sId);
    updateImportPrice(selectedProductId, sId);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      await createStockImport(formData);
      alert("Nhập kho thành công!");
      router.push("/admin/inventory");
    } catch (err: any) {
      alert("Lỗi: " + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="form-group">
        <label>Chọn Sản phẩm <span style={{ color: '#ef4444' }}>*</span></label>
        <select 
          name="productId" 
          className="form-control" 
          required
          value={selectedProductId}
          onChange={handleProductChange}
        >
          <option value="">-- Lựa chọn sản phẩm --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} (Tồn hiện tại: {p.stock})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Nhà Cung Cấp</label>
        <select 
          name="supplierId" 
          className="form-control"
          value={selectedSupplierId}
          onChange={handleSupplierChange}
        >
          <option value="">-- Bỏ qua nếu không rõ --</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Số lượng nhập <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="number" name="quantity" min="1" className="form-control" required placeholder="VD: 50" />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Giá nhập (VNĐ) <span style={{ color: '#ef4444' }}>*</span></label>
          <input 
            type="text" 
            className="form-control" 
            required 
            placeholder="VD: 2,000,000" 
            value={importPrice}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              if (raw) {
                setImportPrice(parseInt(raw, 10).toLocaleString("en-US"));
              } else {
                setImportPrice("");
              }
            }}
          />
          <input type="hidden" name="importPrice" value={importPrice.replace(/,/g, '')} />
        </div>
      </div>

      <div className="form-group">
        <label>Ghi chú Phiếu nhập</label>
        <textarea name="note" className="form-control" rows={3} placeholder="VD: Nhập lô hàng đầu tháng từ nhà phân phối..."></textarea>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '12px' }}>
        {isSubmitting ? "Đang xử lý..." : "Xác nhận Nhập Kho"}
      </button>
    </form>
  );
}
