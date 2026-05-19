import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, Printer, ShoppingBag, User, Calendar, Tag, CheckCircle, Clock, XCircle } from "lucide-react";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: "Chờ thanh toán", color: "#f59e0b", icon: Clock },
  completed: { label: "Đã thanh toán",  color: "#10b981", icon: CheckCircle },
  cancelled: { label: "Đã huỷ",         color: "#ef4444", icon: XCircle },
};

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  const saleId = parseInt(params.id);
  
  if (isNaN(saleId)) {
    notFound();
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!sale) {
    notFound();
  }

  const cfg = STATUS_CONFIG[sale.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <Link href="/admin/sales" className="btn btn-action" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px' }}>
            <ArrowLeft size={16} /> Quay lại danh sách
          </Link>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
              <ShoppingBag size={20} />
            </span>
            Chi Tiết Đơn Bán #{sale.id.toString().padStart(4, '0')}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/admin/sales/${sale.id}/print`} target="_blank" className="btn btn-primary" style={{ background: '#0ea5e9' }}>
            <Printer size={16} style={{ marginRight: '6px' }} /> In Hóa Đơn (A4)
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} color="var(--primary)" /> Danh sách sản phẩm
            </h3>
            <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th style={{ textAlign: 'center' }}>Số lượng</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.product.name}</strong></td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{item.unitPrice.toLocaleString('en-US')} ₫</td>
                      <td style={{ textAlign: 'right' }}><strong>{(item.unitPrice * item.quantity).toLocaleString('en-US')} ₫</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600, padding: '16px' }}>Tổng cộng:</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', padding: '16px' }}>
                      {sale.totalAmount.toLocaleString('en-US')} ₫
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {sale.notes && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-light)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <strong>Ghi chú:</strong>
                <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>{sale.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary)" /> Thông tin khách hàng
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Họ tên</div>
                <strong>{sale.customerName}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Điện thoại</div>
                <a href={`tel:${sale.customerPhone}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>{sale.customerPhone || 'Không có'}</a>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary)" /> Thông tin đơn
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã đơn:</span>
                <strong>#{sale.id.toString().padStart(4, '0')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngày tạo:</span>
                <span>{new Date(sale.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trạng thái:</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: `${cfg.color}18`, color: cfg.color,
                  borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 600
                }}>
                  <StatusIcon size={12} /> {cfg.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
