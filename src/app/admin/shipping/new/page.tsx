import Link from "next/link";
import ShippingCarrierForm from "./ShippingCarrierForm";

export default function NewShippingCarrierPage() {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">
          <span style={{ fontSize: "1.5rem" }}>🚚</span> Thêm Nhà Xe / Kênh Vận Chuyển Mới
        </h2>
        <Link href="/admin/shipping" className="btn-back">
          &lt; Quay lại
        </Link>
      </div>

      <div className="card">
        <ShippingCarrierForm />
      </div>
    </div>
  );
}
