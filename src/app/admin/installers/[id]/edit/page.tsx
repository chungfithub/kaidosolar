import { PrismaClient } from "@prisma/client";
import { updateInstaller } from "@/app/actions/installer";
import Link from "next/link";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditInstallerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const installer = await prisma.installer.findUnique({
    where: { id: parseInt(id) }
  });

  if (!installer) {
    notFound();
  }

  const updateAction = updateInstaller.bind(null, installer.id);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">
          <span style={{ fontSize: "1.5rem" }}>✏️</span> Chỉnh Sửa Thợ Lắp Đặt
        </h2>
        <Link href="/admin/installers" className="btn-back">
          <span>&lt; Quay lại</span>
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
        <form action={updateAction} className="column-main">
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>Tên đội thợ / Cá nhân *</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={installer.name} 
              className="form-control" 
              required 
              placeholder="VD: Đội thợ Nguyễn Văn A" 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem' }}
            />
          </div>

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>Số điện thoại</label>
              <input 
                type="text" 
                name="phone" 
                defaultValue={installer.phone || ""} 
                className="form-control" 
                placeholder="VD: 0987654321" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>Khu vực hoạt động</label>
              <input 
                type="text" 
                name="regions" 
                defaultValue={installer.regions || ""} 
                className="form-control" 
                placeholder="VD: Miền Bắc, Hà Nội..." 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>Ghi chú / Kinh nghiệm</label>
            <textarea 
              name="notes" 
              defaultValue={installer.notes || ""} 
              className="form-control" 
              rows={4} 
              placeholder="Có kinh nghiệm lắp áp mái, điện mặt đất..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem', resize: 'vertical' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <Link href="/admin/installers" style={{ padding: '14px 24px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>
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
