import { getInventoryStats } from "@/app/actions/inventory";
import Link from "next/link";
import { Package, DollarSign, TrendingUp, Download } from "lucide-react";

export default async function InventoryPage() {
  const { totalItems, totalValue, products } = await getInventoryStats();

  const formatMoney = (amount: number) => {
    return (new Intl.NumberFormat('en-US').format(amount) + ' đ');
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">
            <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '20px' }}>🏢</span>
            Quản lý kho
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Tổng hợp danh sách hàng tồn và giá trị tồn kho hiện tại.</p>
        </div>
        <Link href="/admin/inventory/import" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> Nhập Hàng Mới
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Tổng Số Sản Phẩm Tồn</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', color: 'var(--text)' }}>{totalItems} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>cái</span></h3>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Tổng Giá Trị Tồn Kho</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.8rem', color: 'var(--primary-light)' }}>{formatMoney(totalValue)}</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Danh sách hàng trong kho</span>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Mã / Tên</th>
              <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Số Lượng Tồn</th>
              <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Giá Nhập (Tham khảo)</th>
              <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Tổng Trị Giá</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Kho hiện đang trống. Bấm "Nhập Hàng Mới" để bắt đầu.</td>
              </tr>
            ) : (
              products.map(p => {
                let costPrice = 0;
                if (p.supplierPrices && p.supplierPrices.length > 0) {
                  costPrice = p.supplierPrices[0].importPrice;
                }

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <strong style={{ display: 'block', color: 'var(--text)' }}>{p.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>#{p.id} • {p.capacity || p.category}</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '50px', fontWeight: 'bold' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                      {costPrice > 0 ? formatMoney(costPrice) : <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Chưa có giá nhập</span>}
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 'bold', color: 'var(--primary-light)' }}>
                      {formatMoney(costPrice * p.stock)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
