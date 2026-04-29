"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Search, Plus, Trash2, ShoppingCart } from "lucide-react";
import { createSale } from "@/app/actions/sale";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/products-list")
      .then(r => r.json())
      .then(data => setProducts(data));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price }];
    });
    setSearch("");
    setShowDropdown(false);
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== id));
    } else {
      setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
    }
  };

  const updatePrice = (id: number, price: number) => {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, unitPrice: price } : i));
  };

  const total = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) { alert("Vui lòng thêm sản phẩm vào đơn hàng"); return; }
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(cart.map(i => ({
      productId: i.product.id,
      quantity: i.quantity,
      unitPrice: i.unitPrice
    }))));
    try {
      await createSale(formData);
    } catch {
      alert("Đã lưu đơn thành công!");
      router.push("/admin/sales");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
            <ShoppingCart size={20} />
          </span>
          Tạo Đơn Bán Hàng
        </h1>
        <Link href="/admin/sales" className="btn-back">
          <ChevronLeft size={16} /> Quay lại
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* Left: Products */}
          <div>
            {/* Product search */}
            <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '15px' }}>Chọn sản phẩm</h3>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Tìm sản phẩm theo tên, thương hiệu..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  style={{ paddingLeft: '36px' }}
                />
                {showDropdown && search && filtered.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                    maxHeight: '280px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                  }}>
                    {filtered.map(p => (
                      <div key={p.id} onMouseDown={() => addToCart(p)} style={{
                        padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{p.brand} · Tồn: {p.stock}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px' }}>
                          {p.price.toLocaleString("en-US")} ₫
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart table */}
            {cart.length > 0 && (
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px' }}>Sản phẩm trong đơn ({cart.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cart.map(item => (
                    <div key={item.product.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 90px 130px auto',
                      gap: '10px', alignItems: 'center', padding: '12px',
                      background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.product.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Tồn kho: {item.product.stock}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>Số lượng</label>
                        <input
                          type="number" min="1" max={item.product.stock}
                          value={item.quantity}
                          onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                          className="form-control"
                          style={{ textAlign: 'center', padding: '6px', fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>Đơn giá (₫)</label>
                        <input
                          type="text"
                          value={item.unitPrice.toLocaleString("en-US")}
                          onChange={e => {
                            const raw = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                            updatePrice(item.product.id, raw);
                          }}
                          className="form-control"
                          style={{ padding: '6px', fontSize: '13px' }}
                        />
                      </div>
                      <button type="button" onClick={() => updateQty(item.product.id, 0)}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cart.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                <ShoppingCart size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 10px' }} />
                Tìm và thêm sản phẩm vào đơn hàng
              </div>
            )}
          </div>

          {/* Right: Customer + Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '15px' }}>Thông tin khách hàng</h3>
              <div className="form-group">
                <label>Tên khách hàng *</label>
                <input type="text" name="customerName" className="form-control" required placeholder="VD: Anh Tuấn" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Số điện thoại</label>
                <input type="text" name="customerPhone" className="form-control" placeholder="VD: 0987654321" />
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '15px' }}>Ghi chú đơn hàng</h3>
              <textarea name="notes" className="form-control" rows={3} placeholder="Ghi chú thêm..." style={{ marginBottom: 0 }}></textarea>
            </div>

            {/* Total summary */}
            <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #0f172a, #064e3b)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>
                <span>Số sản phẩm</span>
                <span style={{ color: 'white' }}>{cart.reduce((s, i) => s + i.quantity, 0)} đơn vị</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>Tổng tiền</span>
                <span style={{ fontWeight: 800, fontSize: '18px', color: '#34d399' }}>
                  {total.toLocaleString("en-US")} ₫
                </span>
              </div>

              <button type="submit" disabled={isSubmitting || cart.length === 0}
                style={{
                  marginTop: '16px', width: '100%', padding: '14px',
                  background: (isSubmitting || cart.length === 0) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontWeight: 700, fontSize: '15px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: cart.length > 0 ? '0 4px 14px rgba(16,185,129,0.4)' : 'none',
                  transition: 'all 0.2s'
                }}>
                {isSubmitting ? "Đang lưu..." : "✅ Xác nhận & Lưu Đơn"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
