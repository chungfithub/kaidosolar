import { PrismaClient } from "@prisma/client";
import { updateCarrier } from "@/app/actions/shipping";
import Link from "next/link";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditCarrierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const carrier = await prisma.shippingCarrier.findUnique({
    where: { id: parseInt(id) }
  });

  if (!carrier) {
    notFound();
  }

  const updateAction = updateCarrier.bind(null, carrier.id);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">
          <span style={{ fontSize: "1.5rem" }}>✏️</span> Chỉnh Sửa Kênh Vận Chuyển
        </h2>
        <Link href="/admin/shipping" className="btn-back">
          <span>&lt; Quay lại</span>
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
        <form action={updateAction} className="column-main">
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>Tên nhà xe / Đơn vị vận chuyển *</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={carrier.name} 
              className="form-control" 
              required 
              placeholder="VD: Nhà xe Phương Trang" 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem' }}
            />
          </div>

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>Số điện thoại</label>
              <input 
                type="text" 
                name="phone" 
                defaultValue={carrier.phone || ""} 
                className="form-control" 
                placeholder="VD: 1900 6067" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>Tuyến vận chuyển</label>
              <input 
                type="text" 
                name="routes" 
                defaultValue={carrier.routes || ""} 
                className="form-control" 
                placeholder="VD: Hà Nội - Đà Nẵng, TP.HCM - Cần Thơ" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>Ghi chú / Thông tin thêm</label>
            <textarea 
              name="notes" 
              defaultValue={carrier.notes || ""} 
              className="form-control" 
              rows={4} 
              placeholder="Chuyên chở hàng nặng, tấm pin..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem', resize: 'vertical' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <Link href="/admin/shipping" style={{ padding: '14px 24px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>
              Hủy bỏ
            </Link>
            <button type="submit" style={{ padding: '14px 28px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.2s', fontSize: '1rem' }}>
              💾 Lưu Cập Nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
