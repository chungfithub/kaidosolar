import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Truck, Edit, MapPin, Phone, FileText } from "lucide-react";
import ShippingSearch from "./ShippingSearch";

const prisma = new PrismaClient();

export default async function ShippingPage() {
  const carriers = await prisma.shippingCarrier.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '20px' }}>🚚</span>
          Kênh Vận Chuyển
        </h1>
        <Link href="/admin/shipping/new" className="btn btn-primary">
          + Thêm Nhà Xe
        </Link>
      </div>

      <ShippingSearch carriers={carriers} />

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Nhà Xe / Đơn Vị</th>
              <th>Số điện thoại</th>
              <th>Tuyến vận chuyển</th>
              <th>Ghi chú</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {carriers.map(c => (
              <tr key={c.id}>
                <td>#{c.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} style={{ color: 'var(--primary)' }} />
                    <strong>{c.name}</strong>
                  </div>
                </td>
                <td>
                  {c.phone ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                      {c.phone}
                    </div>
                  ) : 'N/A'}
                </td>
                <td>
                  {c.routes ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={14} style={{ color: 'var(--primary-light)', marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem' }}>{c.routes}</span>
                    </div>
                  ) : 'N/A'}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {c.notes ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <FileText size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                      {c.notes}
                    </div>
                  ) : 'Không có ghi chú'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/shipping/${c.id}/edit`} className="btn btn-action" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--primary-light)' }}>
                      <Edit size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {carriers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Truck size={40} style={{ opacity: 0.3 }} />
                    <span>Chưa có nhà xe nào. Nhấn &quot;+ Thêm Nhà Xe&quot; để bắt đầu.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
