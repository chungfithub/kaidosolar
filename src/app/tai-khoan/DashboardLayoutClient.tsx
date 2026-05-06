"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayoutClient({ children, session, logoutAction }: { children: React.ReactNode, session: any, logoutAction: string | ((formData: FormData) => void) }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/tai-khoan", label: "📊 Tổng quan", exact: true },
    { href: "/tai-khoan/don-hang", label: "📦 Đơn hàng" },
    { href: "/tai-khoan/du-an", label: "🏗️ Dự án" },
    { href: "/tai-khoan/bao-hanh", label: "🛡️ Bảo hành" },
    { href: "/tai-khoan/cai-dat", label: "⚙️ Cài đặt" },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar scrolled" style={{ position: "relative", zIndex: 1100 }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: "block", background: "none", border: "none", color: "var(--text)", fontSize: "1.5rem", cursor: "pointer", padding: 0, position: "relative", zIndex: 1100 }}>
              <span className="hide-on-desktop">☰</span>
            </button>
            <Link href="/" className="nav-logo" style={{ position: "static", transform: "none", display: "flex" }}>Kaido <span style={{ marginLeft: "4px" }}>Solar</span></Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }} className="hide-on-mobile">
              👤 {session.name}
            </span>
            <form action={logoutAction}>
              <button type="submit" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-muted)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`modal-overlay ${isMenuOpen ? "active" : ""}`} onClick={() => setIsMenuOpen(false)} style={{ zIndex: 999 }}></div>

      <div style={{ minHeight: "100vh", paddingTop: "80px", display: "flex" }}>
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${isMenuOpen ? "open" : ""}`} style={{ width: "240px", flexShrink: 0, background: "var(--dark-surface)", borderRight: "1px solid rgba(16,185,129,0.1)", padding: "32px 16px", position: "sticky", top: "80px", height: "calc(100vh - 80px)", overflowY: "auto" }}>


          <div style={{ marginBottom: "28px", paddingLeft: "12px", marginTop: "24px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Tài khoản của</div>
            <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1rem" }}>{session.name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", wordBreak: "break-all" }}>{session.email}</div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ display: "block", padding: "10px 14px", borderRadius: "10px", color: isActive ? "var(--primary)" : "var(--text)", background: isActive ? "rgba(16,185,129,0.1)" : "transparent", textDecoration: "none", fontSize: "0.95rem", transition: "all 0.2s", fontWeight: isActive ? 600 : 500 }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: "auto", paddingTop: "32px" }}>
            <Link href="/" style={{ display: "block", padding: "10px 14px", borderRadius: "10px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>
              ← Về trang chủ
            </Link>
            <Link href="/cart" style={{ display: "block", padding: "10px 14px", borderRadius: "10px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>
              🛒 Giỏ hàng
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="dashboard-main" style={{ flex: 1, padding: "40px", overflowX: "hidden", background: "var(--dark-bg)" }}>
          {children}
        </main>
      </div>
    </>
  );
}
