"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Search, Trash2, ShoppingCart, User, Phone, CheckCircle2, PackageSearch } from "lucide-react";
import { createSale } from "@/app/actions/sale";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand?: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export default function NewSalePage() {
  const router = useRouter();
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Search state
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  
  // UI state
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Customer Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const customerSearchRef = useRef<HTMLDivElement>(null);
  const productSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch products
    fetch("/api/products-list")
      .then(r => r.json())
      .then(data => setProducts(data));
      
    // Fetch customers
    fetch("/api/customers-list")
      .then(r => r.json())
      .then(data => setCustomers(data));
      
    // Handle outside clicks for dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(productSearch.toLowerCase())
  );
  
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
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
    setProductSearch("");
    setShowProductDropdown(false);
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
  
  const selectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const total = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) { alert("Vui lòng thêm sản phẩm vào đơn hàng"); return; }
    if (!customerName || !customerPhone) { alert("Vui lòng điền tên và SĐT khách hàng"); return; }
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(cart.map(i => ({
      productId: i.product.id,
      quantity: i.quantity,
      unitPrice: i.unitPrice
    }))));
    
    // Explicitly set customer details
    formData.set("customerName", customerName);
    formData.set("customerPhone", customerPhone);
    
    try {
      await createSale(formData);
    } catch {
      alert("Đã lưu đơn thành công!");
      router.push("/admin/sales");
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', margin: 0, fontWeight: 700, color: '#0f172a' }}>
          <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
            <ShoppingCart size={22} />
          </span>
          Tạo Đơn Bán Hàng
        </h1>
        <Link href="/admin/sales" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem', padding: '8px 16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }} className="hover-shadow">
          <ChevronLeft size={16} /> Quay lại
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px', alignItems: 'start' }}>

          {/* Left Column: Products */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Product Search Card */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageSearch size={18} color="#10b981" />
                Tìm & Thêm Sản Phẩm
              </h3>
              
              <div style={{ position: 'relative' }} ref={productSearchRef}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Nhập tên sản phẩm hoặc thương hiệu..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => setShowProductDropdown(true)}
                  style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#f8fafc', transition: 'all 0.2s', outline: 'none' }}
                  className="input-focus-emerald"
                />
                
                {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                    maxHeight: '320px', overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                  }}>
                    {filteredProducts.map(p => (
                      <div key={p.id} onMouseDown={() => addToCart(p)} style={{
                        padding: '14px 18px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'background 0.2s'
                      }} className="hover-bg-slate">
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>{p.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', marginRight: '8px' }}>{p.brand || 'Khác'}</span>
                            Tồn kho: <span style={{ fontWeight: p.stock > 0 ? 600 : 400, color: p.stock > 0 ? '#10b981' : '#ef4444' }}>{p.stock}</span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>
                          {p.price.toLocaleString("en-US")} ₫
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showProductDropdown && productSearch && filteredProducts.length === 0 && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'center', color: '#64748b', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    Không tìm thấy sản phẩm nào
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            {cart.length > 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: 600 }}>Sản phẩm trong đơn ({cart.length})</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {cart.map((item, index) => (
                    <div key={item.product.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 100px 140px auto',
                      gap: '16px', alignItems: 'center', padding: '20px 24px',
                      borderBottom: index < cart.length - 1 ? '1px solid #e2e8f0' : 'none',
                      transition: 'background 0.2s'
                    }} className="hover-bg-slate">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a', marginBottom: '4px' }}>{item.product.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Còn lại trong kho: {item.product.stock}</div>
                      </div>
                      
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 500 }}>SỐ LƯỢNG</label>
                        <input
                          type="number" min="1" max={item.product.stock}
                          value={item.quantity}
                          onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                          style={{ width: '100%', textAlign: 'center', padding: '8px', fontSize: '0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                          className="input-focus-emerald"
                        />
                      </div>
                      
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 500 }}>ĐƠN GIÁ (₫)</label>
                        <input
                          type="text"
                          value={item.unitPrice.toLocaleString("en-US")}
                          onChange={e => {
                            const raw = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                            updatePrice(item.product.id, raw);
                          }}
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#10b981', fontWeight: 600 }}
                          className="input-focus-emerald"
                        />
                      </div>
                      
                      <button type="button" onClick={() => updateQty(item.product.id, 0)} title="Xóa sản phẩm"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: '#ef4444', marginTop: '18px', transition: 'all 0.2s' }}
                        className="hover-bg-red">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <ShoppingCart size={32} color="#94a3b8" />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#334155', fontWeight: 600 }}>Giỏ hàng đang trống</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Hãy tìm và chọn sản phẩm ở ô tìm kiếm phía trên để bắt đầu tạo đơn hàng.</p>
              </div>
            )}
          </div>

          {/* Right Column: Customer & Checkout (Sticky) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
            
            {/* Customer Information Card */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#3b82f6" />
                Thông tin khách hàng
              </h3>
              
              {/* Customer Auto-complete Search */}
              <div style={{ marginBottom: '20px', position: 'relative' }} ref={customerSearchRef}>
                <label style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tìm khách hàng cũ (Tùy chọn)</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Nhập Tên hoặc SĐT để tìm..."
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: '#f8fafc' }}
                    className="input-focus-blue"
                  />
                  
                  {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 60,
                      background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                      maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}>
                      {filteredCustomers.map(c => (
                        <div key={c.id} onMouseDown={() => selectCustomer(c)} style={{
                          padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                          display: 'flex', flexDirection: 'column', gap: '2px'
                        }} className="hover-bg-slate">
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{c.name}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={10} /> {c.phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: '1px', background: '#e2e8f0', margin: '0 -24px 20px' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tên khách hàng *</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required 
                    placeholder="VD: Anh Tuấn" 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                    className="input-focus-emerald"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Số điện thoại *</label>
                  <input 
                    type="text" 
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    required 
                    placeholder="VD: 0987654321" 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                    className="input-focus-emerald"
                  />
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: '#1e293b', fontWeight: 600 }}>Ghi chú đơn hàng</h3>
              <textarea 
                name="notes" 
                rows={3} 
                placeholder="Ghi chú thêm về giao hàng, đóng gói..." 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}
                className="input-focus-emerald"
              ></textarea>
            </div>

            {/* Checkout Summary Card */}
            <div style={{ padding: '24px', borderRadius: '16px', background: '#0f172a', color: 'white', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: 'white', fontWeight: 600 }}>Tổng quan đơn hàng</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem', color: '#94a3b8' }}>
                <span>Tổng số lượng</span>
                <span style={{ color: 'white', fontWeight: 500 }}>{cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.95rem', color: '#94a3b8' }}>
                <span>Tạm tính</span>
                <span style={{ color: 'white', fontWeight: 500 }}>{total.toLocaleString("en-US")} ₫</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
                <span style={{ fontWeight: 500, fontSize: '1.1rem' }}>Thành tiền</span>
                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#34d399' }}>
                  {total.toLocaleString("en-US")} ₫
                </span>
              </div>

              <button type="submit" disabled={isSubmitting || cart.length === 0}
                style={{
                  width: '100%', padding: '16px',
                  background: (isSubmitting || cart.length === 0) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: (isSubmitting || cart.length === 0) ? '#94a3b8' : 'white', 
                  border: 'none', borderRadius: '12px',
                  fontWeight: 700, fontSize: '1.05rem', 
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: (isSubmitting || cart.length === 0) ? 'none' : '0 4px 14px rgba(16,185,129,0.4)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  transition: 'all 0.2s'
                }}>
                {isSubmitting ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Xác nhận & Lưu Đơn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{__html: `
        .input-focus-emerald:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.1) !important; }
        .input-focus-blue:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; }
        .hover-bg-slate:hover { background-color: #f8fafc !important; }
        .hover-bg-red:hover { background-color: #fee2e2 !important; border-color: #fca5a5 !important; }
        .hover-shadow:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
      `}} />
    </div>
  );
}
