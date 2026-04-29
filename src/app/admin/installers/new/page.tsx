import Link from "next/link";
import { saveInstaller } from "@/app/actions/installer";

export default function NewInstallerPage() {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">
          <span style={{ fontSize: "1.5rem" }}>👷</span> Thêm Đội Thợ Mới
        </h2>
        <Link href="/admin/installers" className="btn-back">
          <span>&lt; Quay lại</span>
        </Link>
      </div>

      <div className="card">
        <form action={saveInstaller} className="column-main">
          <div className="form-group">
            <label>Tên Đội Thợ / Trưởng Nhóm *</label>
            <input type="text" name="name" className="form-control" required placeholder="VD: Đội anh Hùng" />
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input type="text" name="phone" className="form-control" placeholder="VD: 0987654321" />
            </div>
            <div className="form-group">
              <label>Khu vực thi công</label>
              <input type="text" name="regions" className="form-control" placeholder="VD: Hà Nội, Bắc Ninh..." />
            </div>
          </div>

          <div className="form-group">
            <label>Kinh nghiệm / Ghi chú</label>
            <textarea name="notes" className="form-control" rows={4} placeholder="VD: Chuyên thi công mái nghiêng, có chứng chỉ an toàn điện..."></textarea>
          </div>

          <button type="submit" className="btn-save" style={{ marginTop: "16px" }}>
            💾 Lưu Đội Thợ
          </button>
        </form>
      </div>
    </div>
  );
}
