import Link from "next/link";
import { saveSupplier } from "@/app/actions/supplier";

export default function NewSupplierPage() {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">
          <span style={{ fontSize: "1.5rem" }}>🏢</span> Thêm Nhà Cung Cấp Mới
        </h2>
        <Link href="/admin/suppliers" className="btn-back">
          <span>&lt; Quay lại</span>
        </Link>
      </div>

      <div className="card">
        <form action={saveSupplier} className="column-main">
          <div className="form-group">
            <label>Tên nhà cung cấp *</label>
            <input type="text" name="name" className="form-control" required placeholder="VD: Công ty Solar VN" />
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input type="text" name="phone" className="form-control" placeholder="VD: 0987654321" />
            </div>
            <div className="form-group">
              <label>Khu vực</label>
              <input type="text" name="regions" className="form-control" placeholder="VD: Miền Bắc, Hà Nội..." />
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Link Facebook</label>
              <input type="text" name="facebook" className="form-control" placeholder="VD: https://facebook.com/nhacungcap" />
            </div>
            <div className="form-group">
              <label>Số Zalo</label>
              <input type="text" name="zalo" className="form-control" placeholder="VD: 0987654321" />
            </div>
          </div>

          <div className="form-group">
            <label>Địa chỉ</label>
            <input type="text" name="address" className="form-control" placeholder="Địa chỉ chi nhánh/kho hàng" />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea name="notes" className="form-control" rows={4} placeholder="Thông tin thêm về sản phẩm thế mạnh, công nợ..."></textarea>
          </div>

          <button type="submit" className="btn-save" style={{ marginTop: "16px" }}>
            💾 Lưu Nhà Cung Cấp
          </button>
        </form>
      </div>
    </div>
  );
}
