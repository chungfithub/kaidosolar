"use client";

import { registerCustomer } from "@/app/actions/customer-auth";
import Link from "next/link";
import { useState } from "react";

export default function DangKyPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await registerCustomer(fd);
    if (res && !res.success) {
      setError(res.error ?? "Có lỗi xảy ra.");
      setLoading(false);
    }
    // on success, server redirects to /tai-khoan
  };

  return (
    <>
      <nav className="navbar scrolled">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
          <Link href="/" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
            ← <span className="hide-on-mobile">Trang chủ</span>
          </Link>
        </div>
      </nav>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 20px 60px", background: "linear-gradient(135deg, #0a0a1a 0%, #0d1f1a 100%)" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>☀️</div>
            <h1 style={{ color: "var(--accent)", fontSize: "1.8rem", marginBottom: "8px" }}>Tạo tài khoản</h1>
            <p style={{ color: "var(--text-muted)" }}>Theo dõi đơn hàng, dự án và bảo hành của bạn</p>
          </div>

          <form onSubmit={handleSubmit} style={{ background: "var(--dark-surface)", borderRadius: "20px", padding: "36px", border: "1px solid rgba(16,185,129,0.2)", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-group">
              <label>Họ và tên *</label>
              <input type="text" name="name" required placeholder="Nguyễn Văn A" />
            </div>

            <div className="form-group">
              <label>Số điện thoại *</label>
              <input type="tel" name="phone" required placeholder="0901 234 567"
                style={{ letterSpacing: "0.5px" }} />
              <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                💡 Dùng SĐT đã đặt hàng để liên kết đơn hàng cũ tự động
              </small>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" required placeholder="example@email.com" />
            </div>

            <div className="form-group">
              <label>Mật khẩu * <small style={{ color: "var(--text-muted)" }}>(ít nhất 6 ký tự)</small></label>
              <input type="password" name="password" required placeholder="••••••••" minLength={6} />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu *</label>
              <input type="password" name="confirm" required placeholder="••••••••" minLength={6} />
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", color: "#f87171", fontSize: "0.9rem" }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: "1rem", padding: "15px", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Đang xử lý..." : "🚀 Tạo tài khoản"}
            </button>

            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Đã có tài khoản?{" "}
              <Link href="/dang-nhap" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
