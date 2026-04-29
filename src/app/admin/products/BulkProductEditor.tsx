"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trash2, ImagePlus, X } from "lucide-react";
import { saveBulkProducts } from "../../actions/product";

export default function BulkProductEditor({ suppliers }: { suppliers?: any[] }) {
  const [products, setProducts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // lock AI changes after save
  const [globalSupplierId, setGlobalSupplierId] = useState<string>("");
  const router = useRouter();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleImageUpload = async (productId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        updateProduct(productId, "images", [data.url]);
      }
    } catch {
      // Fallback: use object URL for preview only
      const url = URL.createObjectURL(file);
      updateProduct(productId, "images", [url]);
    }
  };

  const handleAiData = (dataArray: any[]) => {
    // Merge new parsed products with existing ones
    setProducts(prev => [...prev, ...dataArray.map((data, index) => ({
      id: Date.now() + index, // Temp ID for React keys
      name: data.name || "",
      brand: data.brand || "",
      capacity: data.capacity || "",
      category: data.category && ["panels", "inverters", "batteries", "accessories"].includes(data.category) ? data.category : "panels",
      warranty: data.warrantyNum ? `${data.warrantyNum} ${data.warrantyUnit || "năm"}` : "",
      specs: data.specs || "",
      price: data.price || "",
      stock: data.stock || "0",
      importPrice: "",
      images: [] as string[]
    }))]);
  };

  const updateProduct = (id: number, field: string, value: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProduct = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // ── AI Page Action listener ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      if ((window as any).__kaidoAiLocked) return; // locked after save
      const { field, value, formula } = (e as CustomEvent).detail;
      setProducts(prev => prev.map(p => {
        if (formula) {
          try {
            // Expose ALL numeric fields so formulas like importPrice+30000 work
            const ctx: Record<string, number> = {
              price:       Number(String(p.price).replace(/[^0-9.-]/g, ''))       || 0,
              importPrice: Number(String(p.importPrice).replace(/[^0-9.-]/g, '')) || 0,
              stock:       Number(String(p.stock).replace(/[^0-9.-]/g, ''))       || 0,
            };
            const args = Object.keys(ctx);
            const vals = Object.values(ctx);
            // eslint-disable-next-line no-new-func
            const result = new Function(...args, `return ${formula}`)(...vals);
            if (isNaN(result) || !isFinite(result)) return p;
            return { ...p, [field]: String(Math.round(result)) };
          } catch {
            return p;
          }
        }
        return { ...p, [field]: value };
      }));
    };
    window.addEventListener('kaido-ai-action', handler);
    return () => window.removeEventListener('kaido-ai-action', handler);
  }, []);

  // ── AI Clear listener (xóa toàn bộ hoặc xóa một trường) ───────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      if ((window as any).__kaidoAiLocked) return;
      const { type, field } = (e as CustomEvent).detail;
      if (type === 'clearAll') {
        // Xóa toàn bộ danh sách sản phẩm chưa lưu
        setProducts([]);
      } else if (type === 'clearField' && field) {
        // Xóa trắng một trường cụ thể cho tất cả
        setProducts(prev => prev.map(p => ({ ...p, [field]: '' })));
      }
    };
    window.addEventListener('kaido-ai-clear', handler);
    return () => window.removeEventListener('kaido-ai-clear', handler);
  }, []);

  // ── AI Map listener (per-product field update from image analysis) ────────
  useEffect(() => {
    const handler = (e: Event) => {
      if ((window as any).__kaidoAiLocked) return;
      const { field, map } = (e as CustomEvent).detail as { field: string; map: Record<string, string> };
      setProducts(prev => prev.map(p => {
        // Try exact match first, then case-insensitive partial match
        const exactKey = Object.keys(map).find(k => k === p.name);
        const looseKey = Object.keys(map).find(k =>
          p.name.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(p.name.toLowerCase())
        );
        const key = exactKey || looseKey;
        if (key && map[key] !== undefined) {
          return { ...p, [field]: String(map[key]) };
        }
        return p;
      }));
    };
    window.addEventListener('kaido-ai-map', handler);
    return () => window.removeEventListener('kaido-ai-map', handler);
  }, []);

  // ── AI Products listener (from AiAssistant image upload) ─────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { products: newProducts } = (e as CustomEvent).detail;
      if (Array.isArray(newProducts)) handleAiData(newProducts);
    };
    window.addEventListener('kaido-ai-products', handler);
    return () => window.removeEventListener('kaido-ai-products', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose product data to window so AI assistant can include it as context
  useEffect(() => {
    (window as any).__kaidoBulkCount = products.length;
    (window as any).__kaidoBulkProducts = products.map(p => ({
      name: p.name,
      price: p.price,
      importPrice: p.importPrice,
    }));
  }, [products]);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '20px' }}>🤖</span>
          Thêm Sản Phẩm Hàng Loạt Bằng AI
        </h1>
        <Link href="/admin/products" className="btn-back">
          <ChevronLeft size={16} /> Quay lại
        </Link>
      </div>

      {/* Hint: use AI chat bubble to upload */}
      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(to right,rgba(16,185,129,0.05),rgba(59,130,246,0.05))', border: '2px dashed var(--primary-light)', borderRadius: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤖</div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary)', marginBottom: '6px' }}>Upload ảnh/PDF catalogue qua Kaido AI</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Bấm nút <strong>✨</strong> góc dưới phải → đính kèm ảnh → AI sẽ tự thêm sản phẩm và nhớ bảng giá</div>
        </div>
      )}

      {products.length > 0 && (
        <form action={async (formData) => {
          setIsSubmitting(true);
          try {
            const res = await saveBulkProducts(formData);
            if (res?.success) {
              (window as any).__kaidoAiLocked = true; // lock AI from further changes
              setIsSaved(true);
              router.push("/admin/products");
            } else {
              alert("Lưu không thành công. Vui lòng thử lại.");
              setIsSubmitting(false);
            }
          } catch (e) {
            console.error(e);
            alert("Lỗi khi lưu dữ liệu. Vui lòng kiểm tra console.");
            setIsSubmitting(false);
          }
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Danh sách sản phẩm chờ duyệt ({products.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isSaved && (
                <span style={{ fontSize: '12px', color: '#ef4444', background: '#fee2e2', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>🔒 Đã lưu — AI không thể thay đổi</span>
              )}
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isSaved}>
                {isSubmitting ? "Đang xử lý..." : isSaved ? "✅ Đã lưu" : "Lưu Tất Cả Sản Phẩm"}
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '16px', marginBottom: '24px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>Thông tin nhập hàng chung</h4>
            <div className="form-group" style={{ marginBottom: 0, maxWidth: '400px' }}>
              <label style={{ fontSize: '13px' }}>Nhà cung cấp (Áp dụng cho tất cả sản phẩm dưới đây)</label>
              <select 
                className="form-control" 
                value={globalSupplierId} 
                onChange={(e) => setGlobalSupplierId(e.target.value)}
              >
                <option value="">-- Không chọn nhà cung cấp --</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <input type="hidden" name="products" value={JSON.stringify(products)} />
          <input type="hidden" name="globalSupplierId" value={globalSupplierId} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {products.map((p, index) => (
              <div key={p.id} className="card" style={{ padding: '16px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: 'var(--primary-light)' }}>Sản phẩm {index + 1}</h4>
                  <button type="button" onClick={() => removeProduct(p.id)} className="btn-remove-row" style={{ marginTop: 0 }}>
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Tên sản phẩm *</label>
                    <input type="text" className="form-control" value={p.name} onChange={(e) => updateProduct(p.id, 'name', e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Danh mục *</label>
                    <select className="form-control" value={p.category} onChange={(e) => updateProduct(p.id, 'category', e.target.value)} required>
                      <option value="panels">Tấm Pin Mặt trời</option>
                      <option value="inverters">Biến tần - Inverter</option>
                      <option value="batteries">Pin Lưu Trữ</option>
                      <option value="accessories">Phụ Kiện Lắp đặt</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Thương hiệu</label>
                    <input type="text" className="form-control" value={p.brand} onChange={(e) => updateProduct(p.id, 'brand', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Công suất</label>
                    <input type="text" className="form-control" value={p.capacity} onChange={(e) => updateProduct(p.id, 'capacity', e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Bảo hành</label>
                    <input type="text" className="form-control" value={p.warranty} onChange={(e) => updateProduct(p.id, 'warranty', e.target.value)} placeholder="VD: 5 năm" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Số lượng kho *</label>
                    <input type="number" className="form-control" value={p.stock} onChange={(e) => updateProduct(p.id, 'stock', e.target.value)} required min="0" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Giá nhập (VNĐ)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={p.importPrice ? Number(p.importPrice).toLocaleString("en-US") : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        updateProduct(p.id, 'importPrice', raw);
                      }}
                      placeholder="VD: 1,500,000"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px' }}>Giá bán (VNĐ) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={p.price ? Number(p.price).toLocaleString("en-US") : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        updateProduct(p.id, 'price', raw);
                      }}
                      required
                      placeholder="VD: 2,000,000"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px' }}>Thông số kỹ thuật</label>
                  <textarea
                    className="form-control"
                    value={p.specs}
                    onChange={(e) => updateProduct(p.id, 'specs', e.target.value)}
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Image upload */}
                <div className="form-group" style={{ marginBottom: 0, marginTop: '12px' }}>
                  <label style={{ fontSize: '12px' }}>Ảnh đại diện sản phẩm</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {p.images?.[0] && (
                      <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                        <img src={p.images[0]} alt="preview"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <button type="button"
                          onClick={() => updateProduct(p.id, 'images', [])}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={11} color="white" />
                        </button>
                      </div>
                    )}
                    <button type="button"
                      onClick={() => fileInputRefs.current[p.id]?.click()}
                      style={{ width: '80px', height: '80px', border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px', flexShrink: 0 }}>
                      <ImagePlus size={20} style={{ color: 'var(--primary)' }} />
                      Thêm ảnh
                    </button>
                    <input
                      type="file" accept="image/*"
                      ref={el => { fileInputRefs.current[p.id] = el; }}
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(p.id, file);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

          </div>
        </form>
      )}
    </div>
  );
}
