import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";

const prisma = new PrismaClient();

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <span className="badge badge-completed">Hoàn thành</span>;
      case 'processing': return <span className="badge badge-pending">Đang xử lý</span>;
      case 'cancelled': return <span className="badge" style={{ background: 'rgba(255,71,87,0.1)', color: 'var(--danger)' }}>Đã hủy</span>;
      default: return <span className="badge" style={{ background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)' }}>Chờ xác nhận</span>;
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Yêu Cầu Báo Giá / Đơn hàng</h3>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td><strong>{o.orderCode}</strong></td>
                <td>{o.customer?.name || "N/A"}<br/><small style={{ color: 'var(--text-muted)' }}>{o.customer?.phone}</small></td>
                <td>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                <td style={{ color: 'var(--primary-light)', fontWeight: 'bold' }}>
                  {(new Intl.NumberFormat('en-US').format(o.total) + ' đ')}
                </td>
                <td>{getStatusBadge(o.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/orders/${o.id}`} className="btn btn-action" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--primary-light)' }}>
                      <Eye size={16} />
                    </Link>
                    <button className="btn btn-action btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
