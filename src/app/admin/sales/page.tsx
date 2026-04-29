import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { ShoppingBag, Plus, Eye, CheckCircle, Clock, XCircle } from "lucide-react";

const prisma = new PrismaClient();

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: "Chờ thanh toán", color: "#f59e0b", icon: Clock },
  completed: { label: "Đã thanh toán",  color: "#10b981", icon: CheckCircle },
  cancelled: { label: "Đã huỷ",         color: "#ef4444", icon: XCircle },
};

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } }
      }
    }
  });

  const totalRevenue = sales
    .filter(s => s.status === "completed")
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const pendingCount = sales.filter(s => s.status === "pending").length;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
            <ShoppingBag size={20} />
          </span>
          Bán Hàng
        </h1>
        <Link href="/admin/sales/new" className="btn btn-primary">
          <Plus size={16} style={{ marginRight: '6px' }} /> Tạo Đơn Bán
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>{sales.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tổng đơn hàng</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{pendingCount}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chờ thanh toán</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>{totalRevenue.toLocaleString("en-US")} ₫</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Doanh thu (đã thanh toán)</div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => {
              const cfg = STATUS_CONFIG[sale.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <tr key={sale.id}>
                  <td><strong style={{ color: 'var(--primary)' }}>#{sale.id.toString().padStart(4, '0')}</strong></td>
                  <td>
                    <div><strong>{sale.customerName}</strong></div>
                    {sale.customerPhone && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sale.customerPhone}</div>}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {sale.items.slice(0, 2).map(i => `${i.product.name} x${i.quantity}`).join(", ")}
                    {sale.items.length > 2 && ` +${sale.items.length - 2} sản phẩm`}
                  </td>
                  <td><strong>{sale.totalAmount.toLocaleString("en-US")} ₫</strong></td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: `${cfg.color}18`, color: cfg.color,
                      borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 600
                    }}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(sale.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    <Link href={`/admin/sales/${sale.id}`} className="btn btn-action" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--primary-light)' }}>
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {sales.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
                  Chưa có đơn bán hàng nào. Nhấn &quot;Tạo Đơn Bán&quot; để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
