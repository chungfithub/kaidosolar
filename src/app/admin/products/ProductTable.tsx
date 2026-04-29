"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";

export default function ProductTable({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [catTerm, setCatTerm] = useState("");
  const [brandTerm, setBrandTerm] = useState("");
  const [regionTerm, setRegionTerm] = useState("");
  const [supplierTerm, setSupplierTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'in-stock'>('all');

  // Extract unique brands
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  
  // Extract unique regions from suppliers
  const regions = Array.from(new Set(
    products.flatMap(p => 
      p.supplierPrices?.map((sp: any) => sp.supplier?.regions).filter(Boolean)
    ).flatMap(r => r.split(',').map((s: string) => s.trim()))
  ));

  // Extract unique suppliers
  const suppliers = Array.from(
    new Map(
      products.flatMap(p =>
        (p.supplierPrices || []).map((sp: any) => sp.supplier).filter(Boolean)
      ).map((s: any) => [s.id, s])
    ).values()
  ) as { id: number; name: string }[];

  const formatMoney = (amount: number) => {
    return (new Intl.NumberFormat('en-US').format(amount) + ' đ');
  };

  const categoryMap: Record<string, string> = {
    panels: 'Tấm Pin',
    inverters: 'Biến Tần',
    batteries: 'Lưu Trữ',
    accessories: 'Phụ Kiện'
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toString().includes(searchTerm);
    const matchCat = catTerm ? p.category === catTerm : true;
    const matchBrand = brandTerm ? p.brand === brandTerm : true;
    
    // Check if the product has any supplier in the selected region
    const matchRegion = regionTerm 
      ? p.supplierPrices?.some((sp: any) => sp.supplier?.regions?.includes(regionTerm))
      : true;

    // Check if the product has the selected supplier
    const matchSupplier = supplierTerm
      ? p.supplierPrices?.some((sp: any) => sp.supplier?.id?.toString() === supplierTerm)
      : true;

    const matchTab = activeTab === 'all' ? true : (p.stock > 0);

    return matchSearch && matchCat && matchBrand && matchRegion && matchSupplier && matchTab;
  });

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      // In a real app, call API to delete
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'white' }}>
        <button 
          onClick={() => setActiveTab('all')}
          style={{ 
            padding: '16px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'all' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'all' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          Tất cả Sản phẩm
        </button>
        <button 
          onClick={() => setActiveTab('in-stock')}
          style={{ 
            padding: '16px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'in-stock' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'in-stock' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'in-stock' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          Sản phẩm Trong Kho
        </button>
      </div>

      <div style={{ 
        padding: '20px 24px', 
        display: 'flex', 
        gap: '16px', 
        borderBottom: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.01)',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '300px' }}>
          <input 
            type="text" 
            placeholder="Tìm kiếm tên hoặc mã sản phẩm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px 12px 40px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
            }} 
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '1.1rem' }}>🔍</span>
        </div>

        <select 
          value={catTerm}
          onChange={(e) => setCatTerm(e.target.value)}
          style={{ 
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            fontSize: '0.95rem',
            outline: 'none',
            background: '#fff',
            cursor: 'pointer',
            minWidth: '150px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        >
          <option value="">📁 Tất cả danh mục</option>
          <option value="panels">☀️ Tấm Pin</option>
          <option value="inverters">⚡ Biến tần</option>
          <option value="batteries">🔋 Lưu Trữ</option>
          <option value="accessories">🔧 Phụ Kiện</option>
        </select>

        <select 
          value={brandTerm}
          onChange={(e) => setBrandTerm(e.target.value)}
          style={{ 
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            fontSize: '0.95rem',
            outline: 'none',
            background: '#fff',
            cursor: 'pointer',
            minWidth: '150px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        >
          <option value="">🏷️ Tất cả thương hiệu</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select 
          value={regionTerm}
          onChange={(e) => setRegionTerm(e.target.value)}
          style={{ 
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            fontSize: '0.95rem',
            outline: 'none',
            background: '#fff',
            cursor: 'pointer',
            minWidth: '150px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        >
          <option value="">📍 Tất cả khu vực</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={supplierTerm}
          onChange={(e) => setSupplierTerm(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            fontSize: '0.95rem',
            outline: 'none',
            background: '#fff',
            cursor: 'pointer',
            minWidth: '170px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        >
          <option value="">🏢 Tất cả nhà cung cấp</option>
          {suppliers.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th style={{ textAlign: 'center' }}>Ảnh</th>
            <th>Tên Sản Phẩm</th>
            <th>Danh mục</th>
            <th>Giá</th>
            <th>Tồn kho</th>
            <th>Công suất</th>
            <th>Nhà cung cấp</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(p => {
            let images = [];
            try { images = JSON.parse(p.images); } catch(e) {}
            const firstImage = images.length > 0 ? images[0] : null;

            return (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td style={{ textAlign: 'center' }}>
                  <Link 
                    href={`/admin/products/${p.id}`} 
                    style={{ display: 'inline-block', transition: 'transform 0.2s' }} 
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} 
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    title="Chỉnh sửa sản phẩm"
                  >
                    {firstImage ? (
                      <img src={firstImage} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                    ) : (
                      <span style={{ fontSize: '2.5rem', cursor: 'pointer', display: 'inline-block' }}>📦</span>
                    )}
                  </Link>
                </td>
                <td>
                  <strong>{p.name}</strong>
                  {p.brand && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{p.brand}</div>}
                </td>
                <td><span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)' }}>{categoryMap[p.category] || p.category}</span></td>
                <td style={{ color: 'var(--primary-light)', fontWeight: 'bold' }}>{formatMoney(p.price)}</td>
                <td>
                  {p.stock > 0 ? (
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{p.stock}</span>
                  ) : (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Hết hàng</span>
                  )}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '.85rem', maxWidth: '150px' }}>
                  <span style={{ fontWeight: '500', color: '#334155' }}>{p.capacity || '-'}</span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {p.supplierPrices?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {p.supplierPrices.map((sp: any) => (
                        <div key={sp.supplierId} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-light)' }}></span>
                          {sp.supplier?.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/products/${p.id}`} className="btn btn-action" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--primary-light)' }}>
                      <Edit size={16} />
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="btn btn-action btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {filteredProducts.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                Không tìm thấy sản phẩm nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
