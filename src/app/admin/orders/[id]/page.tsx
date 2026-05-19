import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, Printer, ShoppingCart, User, Calendar, Tag, CheckCircle, Clock, XCircle } from "lucide-react";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: "Chờ xác nhận", color: "#64748b", icon: Clock },
  processing:{ label: "Đang xử lý", color: "#f59e0b", icon: Clock },
  completed: { label: "Hoàn thành",  color: "#10b981", icon: CheckCircle },
  cancelled: { label: "Đã huỷ",         color: "#ef4444", icon: XCircle },
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const orderId = parseInt(params.id);
  
  if (isNaN(orderId)) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <Link href="/admin/orders" className="btn btn-action" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px' }}>
            <ArrowLeft size={16} /> Quay lại danh sách
          </Link>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
              <ShoppingCart size={20} />
            </span>
            Chi Tiết Đơn Hàng #{order.orderCode}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/admin/orders/${order.id}/print`} target="_blank" className="btn btn-primary" style={{ background: '#0ea5e9' }}>
            <Printer size={16} style={{ marginRight: '6px' }} /> In Báo Giá (A4)
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
                  {order.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.product.name}</strong>
                        {item.warrantyNote && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Bảo hành: {item.warrantyNote}</div>}
                      </td>
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
                      {order.total.toLocaleString('en-US')} ₫
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {order.notes && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-light)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <strong>Ghi chú đơn hàng:</strong>
                <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>{order.notes}</p>
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
                <strong>{order.customer.name}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Điện thoại</div>
                <a href={`tel:${order.customer.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>{order.customer.phone}</a>
              </div>
              {order.customer.email && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Email</div>
                  <div>{order.customer.email}</div>
                </div>
              )}
              {order.customer.address && (
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Địa chỉ</div>
                  <div>{order.customer.address}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary)" /> Thông tin đơn hàng
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã đơn:</span>
                <strong>{order.orderCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngày tạo:</span>
                <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
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
