"use client";

import { loginCustomer } from "@/app/actions/customer-auth";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/tai-khoan";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await loginCustomer(fd);
    if (res && !res.success) {
      setError(res.error ?? "Có lỗi xảy ra.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--dark-surface)", borderRadius: "20px", padding: "36px", border: "1px solid rgba(16,185,129,0.2)", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div className="form-group">
        <label>Email</label>
        <input type="email" name="email" required placeholder="example@email.com" autoComplete="email" />
      </div>

      <div className="form-group">
        <label>Mật khẩu</label>
        <input type="password" name="password" required placeholder="••••••••" autoComplete="current-password" />
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
        {loading ? "Đang đăng nhập..." : "🔐 Đăng nhập"}
      </button>

      <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
          Đăng ký miễn phí
        </Link>
      </p>
    </form>
  );
}

export default function DangNhapPage() {
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
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔐</div>
            <h1 style={{ color: "var(--accent)", fontSize: "1.8rem", marginBottom: "8px" }}>Đăng nhập</h1>
            <p style={{ color: "var(--text-muted)" }}>Quản lý đơn hàng, dự án và bảo hành</p>
          </div>

          <Suspense fallback={<div style={{ color: "var(--text-muted)", textAlign: "center" }}>Đang tải...</div>}>
            <LoginForm />
          </Suspense>

          <div style={{ marginTop: "24px", padding: "16px", background: "rgba(16,185,129,0.06)", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.15)", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              ☀️ Đây là cổng khách hàng Kaido Solar<br />
              <span style={{ fontSize: "0.8rem" }}>Admin? <Link href="/admin/login" style={{ color: "var(--primary)" }}>Đăng nhập tại đây</Link></span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
