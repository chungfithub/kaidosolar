"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveShippingCarrier } from "@/app/actions/shipping";

const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn",
  "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng",
  "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
  "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng",
  "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An",
  "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng",
  "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
  "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

export default function ShippingCarrierForm() {
  const router = useRouter();
  const [departure, setDeparture] = useState("");
  const [departureSearch, setDepartureSearch] = useState("");
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDeparture = PROVINCES.filter(p =>
    p.toLowerCase().includes(departureSearch.toLowerCase())
  );

  const toggleProvince = (province: string) => {
    setSelectedProvinces(prev =>
      prev.includes(province)
        ? prev.filter(p => p !== province)
        : [...prev, province]
    );
  };

  const filteredProvinces = PROVINCES.filter(p =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  const routesValue = [
    departure ? `Xuất phát: ${departure}` : "",
    selectedProvinces.length > 0 ? `Đi qua: ${selectedProvinces.join(", ")}` : ""
  ].filter(Boolean).join(" | ");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("routes", routesValue);
    try {
      await saveShippingCarrier(formData);
      router.push("/admin/shipping");
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="column-main">
      <div className="form-group">
        <label>Tên Nhà Xe / Đơn Vị Vận Chuyển *</label>
        <input
          type="text"
          name="name"
          className="form-control"
          required
          placeholder="VD: Nhà xe Thành Bưởi, Xe Phương Trang..."
        />
      </div>

      <div className="form-group">
        <label>Số điện thoại liên hệ</label>
        <input
          type="text"
          name="phone"
          className="form-control"
          placeholder="VD: 0987654321"
        />
      </div>

      {/* Departure searchable combobox */}
      <div className="form-group" style={{ position: 'relative' }}>
        <label>Điểm xuất phát{departure && <span style={{ fontWeight: 'normal', color: 'var(--primary)', marginLeft: '6px' }}>✓ {departure}</span>}</label>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Tìm tỉnh xuất phát..."
          value={departureSearch}
          onChange={e => { setDepartureSearch(e.target.value); setShowDepartureDropdown(true); }}
          onFocus={() => setShowDepartureDropdown(true)}
          onBlur={() => setTimeout(() => setShowDepartureDropdown(false), 150)}
          autoComplete="off"
        />
        {departure && (
          <button
            type="button"
            onClick={() => { setDeparture(""); setDepartureSearch(""); }}
            style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}
          >×</button>
        )}
        {showDepartureDropdown && filteredDeparture.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
            maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}>
            {filteredDeparture.map(p => (
              <div
                key={p}
                onMouseDown={() => { setDeparture(p); setDepartureSearch(""); setShowDepartureDropdown(false); }}
                style={{
                  padding: '9px 14px', cursor: 'pointer', fontSize: '14px',
                  background: departure === p ? 'rgba(16,185,129,0.1)' : 'white',
                  color: departure === p ? 'var(--primary)' : 'inherit',
                  fontWeight: departure === p ? '600' : 'normal',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                {p}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Tuyến đi qua ({selectedProvinces.length} tỉnh đã chọn)</label>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Tìm nhanh tỉnh thành..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "8px",
          maxHeight: "280px",
          overflowY: "auto",
          padding: "12px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          background: "#f8fafc"
        }}>
          {filteredProvinces.map(p => (
            <label
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: "6px",
                fontSize: "13px",
                background: selectedProvinces.includes(p) ? "rgba(16,185,129,0.12)" : "white",
                border: selectedProvinces.includes(p) ? "1px solid var(--primary)" : "1px solid #e2e8f0",
                transition: "all 0.15s",
                userSelect: "none"
              }}
            >
              <input
                type="checkbox"
                checked={selectedProvinces.includes(p)}
                onChange={() => toggleProvince(p)}
                style={{ accentColor: "var(--primary)", width: "15px", height: "15px" }}
              />
              {p}
            </label>
          ))}
          {filteredProvinces.length === 0 && (
            <span style={{ color: "var(--text-muted)", fontSize: "13px", gridColumn: "1/-1", textAlign: "center", padding: "16px" }}>
              Không tìm thấy tỉnh nào
            </span>
          )}
        </div>

        {selectedProvinces.length > 0 && (
          <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {selectedProvinces.map(p => (
              <span
                key={p}
                style={{
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  cursor: "pointer"
                }}
                onClick={() => toggleProvince(p)}
              >
                {p} ✕
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {routesValue && (
        <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", fontSize: "13px", color: "#065f46", marginBottom: "8px" }}>
          <strong>Tuyến đường:</strong> {routesValue}
        </div>
      )}

      <div className="form-group">
        <label>Ghi chú thêm</label>
        <textarea
          name="notes"
          className="form-control"
          rows={3}
          placeholder="VD: Nhận hàng tại bến xe, chuyên hàng nặng trên 100kg..."
        ></textarea>
      </div>

      <button type="submit" className="btn-save" style={{ marginTop: "16px" }} disabled={isSubmitting}>
        {isSubmitting ? "Đang lưu..." : "💾 Lưu Nhà Xe"}
      </button>
    </form>
  );
}
