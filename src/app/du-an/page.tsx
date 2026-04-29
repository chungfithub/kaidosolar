"use client";

import { registerProject } from "@/app/actions/project-register";
import Link from "next/link";
import { useState } from "react";

const BUDGETS = [
  "Dưới 50 triệu",
  "50 - 100 triệu",
  "100 - 200 triệu",
  "200 - 500 triệu",
  "Trên 500 triệu",
  "Chưa xác định",
];

const SYSTEM_TYPES = [
  { icon: "🏠", label: "Hộ gia đình", desc: "3 - 10 kWp" },
  { icon: "🏢", label: "Doanh nghiệp", desc: "10 - 100 kWp" },
  { icon: "🏭", label: "Công nghiệp", desc: "100 kWp+" },
  { icon: "🌾", label: "Nông nghiệp", desc: "Kết hợp canh tác" },
];

const USAGE_TIMES = [
  {
    value: "day",
    icon: "☀️",
    label: "Ban ngày",
    desc: "Sử dụng điện chủ yếu ban ngày (6h–18h)",
    tip: "Phù hợp hệ hòa lưới không lưu trữ – tiết kiệm chi phí nhất",
    color: "#f59e0b",
  },
  {
    value: "night",
    icon: "🌙",
    label: "Ban đêm",
    desc: "Sử dụng điện chủ yếu ban đêm (18h–6h)",
    tip: "Cần thêm Pin Lưu Trữ để sử dụng điện mặt trời vào ban đêm",
    color: "#6366f1",
  },
  {
    value: "both",
    icon: "🔄",
    label: "Cả ngày lẫn đêm",
    desc: "Sử dụng điện liên tục 24/7",
    tip: "Hệ hybrid: hòa lưới + lưu trữ – tối ưu toàn diện",
    color: "#10b981",
  },
];



export default function DuAnPage() {
  const [selectedType, setSelectedType] = useState("");
  const [usageTime, setUsageTime]       = useState("");
  const [monthlyBill, setMonthlyBill]   = useState(1_500_000);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (selectedType) formData.set("systemType", selectedType);
    formData.set("usageTime", usageTime);
    formData.set("monthlyBill", String(monthlyBill));

    const result = await registerProject(formData);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <>
        <nav className="navbar scrolled">
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
          </div>
        </nav>
        <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "5rem" }}>🎉</div>
          <h1 style={{ color: "var(--primary)", fontSize: "2rem" }}>Đăng ký thành công!</h1>
          <p style={{ color: "var(--text-muted)", maxWidth: "500px", lineHeight: 1.8, fontSize: "1.05rem" }}>
            Cảm ơn bạn đã quan tâm đến Kaido Solar!<br />
            Chuyên viên tư vấn của chúng tôi sẽ <strong style={{ color: "var(--primary)" }}>liên hệ trong vòng 24 giờ</strong> để khảo sát và tư vấn giải pháp phù hợp nhất.
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/" className="btn btn-primary">Về trang chủ</Link>
            <Link href="/#products" className="btn btn-outline" style={{ color: "var(--text)", borderColor: "rgba(255,255,255,0.2)" }}>Xem sản phẩm</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="navbar scrolled">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
          <ul className="nav-links">
            <li><Link href="/">← Trang chủ</Link></li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d1f1a 50%, #0a1510 100%)", padding: "120px 0 80px", borderBottom: "1px solid rgba(16,185,129,0.15)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <div className="hero-badge" style={{ display: "inline-block", marginBottom: "20px" }}>🏗️ Đăng ký dự án lắp đặt</div>
          <h1 style={{ color: "var(--text)", fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "16px" }}>
            Sở Hữu Hệ Thống Điện Mặt Trời<br />
            <span className="highlight">Ngay Hôm Nay</span>
          </h1>
          <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", lineHeight: 1.8, fontSize: "1.05rem" }}>
            Điền thông tin bên dưới. Đội ngũ chuyên gia Kaido Solar sẽ liên hệ khảo sát thực tế và báo giá chi tiết miễn phí.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ background: "var(--dark-surface)", padding: "60px 0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            {[
              { icon: "🆓", title: "Tư vấn miễn phí", desc: "Khảo sát thực tế không tốn phí" },
              { icon: "⚡", title: "Lắp đặt nhanh", desc: "Hoàn thành trong 1-3 ngày" },
              { icon: "🛡️", title: "Bảo hành 25 năm", desc: "Cam kết chất lượng lâu dài" },
              { icon: "💰", title: "Hoàn vốn 4-6 năm", desc: "Tiết kiệm ngay từ tháng đầu" },
            ].map((b, i) => (
              <div key={i} style={{ background: "var(--dark-bg)", borderRadius: "14px", padding: "24px", textAlign: "center", border: "1px solid rgba(16,185,129,0.1)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{b.icon}</div>
                <h4 style={{ color: "var(--accent)", marginBottom: "8px" }}>{b.title}</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section style={{ padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: "760px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* System Type */}
            <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(16,185,129,0.15)" }}>
              <h3 style={{ color: "var(--accent)", marginBottom: "20px", fontSize: "1.1rem" }}>🏗️ Loại hệ thống bạn muốn lắp đặt</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                {SYSTEM_TYPES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setSelectedType(t.label)}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      border: `2px solid ${selectedType === t.label ? "var(--primary)" : "rgba(16,185,129,0.2)"}`,
                      background: selectedType === t.label ? "rgba(16,185,129,0.15)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{t.icon}</div>
                    <div style={{ color: "var(--text)", fontWeight: 600, fontSize: "0.95rem" }}>{t.label}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Monthly Electricity Bill ─────────────────────────────── */}
            <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(16,185,129,0.15)" }}>
              <h3 style={{ color: "var(--accent)", marginBottom: "8px", fontSize: "1.1rem" }}>
                ⚡ Tiền điện hàng tháng của bạn
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "24px" }}>
                Thông tin này giúp chúng tôi tư vấn công suất hệ thống phù hợp nhất
              </p>

              {/* Current value display */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)", lineHeight: 1 }}>
                  {new Intl.NumberFormat("vi-VN").format(monthlyBill)}đ
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>/ tháng</div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={200_000}
                max={10_000_000}
                step={100_000}
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer", height: "6px" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "6px" }}>
                <span>200.000đ</span>
                <span>10.000.000đ</span>
              </div>

              {/* Quick-select buttons */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                {[500_000, 1_000_000, 1_500_000, 2_500_000, 4_000_000, 6_000_000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMonthlyBill(val)}
                    style={{
                      padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem", cursor: "pointer",
                      border: `1px solid ${monthlyBill === val ? "var(--primary)" : "rgba(16,185,129,0.2)"}`,
                      background: monthlyBill === val ? "rgba(16,185,129,0.15)" : "transparent",
                      color: monthlyBill === val ? "var(--primary)" : "var(--text-muted)",
                      transition: "all 0.15s",
                    }}
                  >
                    {new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(val)}đ
                  </button>
                ))}
              </div>
            </div>

            {/* ── Usage Time ──────────────────────────────────────────────── */}
            <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(16,185,129,0.15)" }}>
              <h3 style={{ color: "var(--accent)", marginBottom: "8px", fontSize: "1.1rem" }}>
                🕐 Thời gian sử dụng điện chủ yếu
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "20px" }}>
                Ảnh hưởng đến loại hệ thống và có cần pin lưu trữ hay không
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {USAGE_TIMES.map((u) => {
                  const active = usageTime === u.value;
                  return (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setUsageTime(u.value)}
                      style={{
                        padding: "18px 12px",
                        borderRadius: "14px",
                        border: `2px solid ${active ? u.color : "rgba(255,255,255,0.08)"}`,
                        background: active ? `${u.color}15` : "transparent",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{u.icon}</div>
                      <div style={{ color: active ? u.color : "var(--text)", fontWeight: 700, fontSize: "0.95rem", marginBottom: "4px" }}>{u.label}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: 1.4 }}>{u.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Consultant tip */}
              {usageTime && (() => {
                const u = USAGE_TIMES.find(x => x.value === usageTime)!;
                return (
                  <div style={{ marginTop: "16px", padding: "12px 16px", background: `${u.color}12`, border: `1px solid ${u.color}30`, borderRadius: "10px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.1rem" }}>💡</span>
                    <div>
                      <span style={{ color: u.color, fontWeight: 700, fontSize: "0.88rem" }}>Gợi ý từ chuyên gia: </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{u.tip}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Contact Info */}
            <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(16,185,129,0.15)" }}>
              <h3 style={{ color: "var(--accent)", marginBottom: "20px", fontSize: "1.1rem" }}>👤 Thông tin liên hệ</h3>


              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input type="text" name="name" required placeholder="Nguyễn Văn A" />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input type="tel" name="phone" required placeholder="0901 234 567" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Địa chỉ lắp đặt</label>
                <input type="text" name="address" placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Diện tích mái (m²)</label>
                  <input type="number" name="roofArea" placeholder="VD: 50" min="0" />
                </div>
                <div className="form-group">
                  <label>Ngân sách dự kiến</label>
                  <select
                    name="budget"
                    style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", color: "var(--text)", fontSize: "0.95rem", appearance: "none" }}
                  >
                    <option value="" style={{ background: "#1a1a2e" }}>-- Chọn ngân sách --</option>
                    {BUDGETS.map((b) => (
                      <option key={b} value={b} style={{ background: "#1a1a2e" }}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "16px" }}>
                <label>Ghi chú thêm</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Yêu cầu đặc biệt, thời gian khảo sát phù hợp..."
                  style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", color: "var(--text)", fontSize: "0.95rem", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: "14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", color: "#f87171" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: "1.1rem", padding: "18px", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Đang gửi..." : "🚀 Đăng ký tư vấn miễn phí"}
            </button>

            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Bằng cách đăng ký, bạn đồng ý để Kaido Solar liên hệ tư vấn. Thông tin của bạn được bảo mật hoàn toàn.
            </p>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2024 Kaido Solar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
