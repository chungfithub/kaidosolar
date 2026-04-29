import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutCustomer } from "@/app/actions/customer-auth";
import Link from "next/link";

export default async function TaiKhoanLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/dang-nhap");
  const session = await verifyCustomerToken(token);
  if (!session) redirect("/dang-nhap");

  const navItems = [
    { href: "/tai-khoan", label: "📊 Tổng quan", exact: true },
    { href: "/tai-khoan/don-hang", label: "📦 Đơn hàng" },
    { href: "/tai-khoan/du-an", label: "🏗️ Dự án" },
    { href: "/tai-khoan/bao-hanh", label: "🛡️ Bảo hành" },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar scrolled">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              👤 {session.name}
            </span>
            <form action={logoutCustomer}>
              <button type="submit" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-muted)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div style={{ minHeight: "100vh", paddingTop: "80px", display: "flex" }}>
        {/* Sidebar */}
        <aside style={{ width: "240px", flexShrink: 0, background: "var(--dark-surface)", borderRight: "1px solid rgba(16,185,129,0.1)", padding: "32px 16px", position: "sticky", top: "80px", height: "calc(100vh - 80px)", overflowY: "auto" }}>
          <div style={{ marginBottom: "28px", paddingLeft: "12px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Tài khoản của</div>
            <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1rem" }}>{session.name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{session.email}</div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ display: "block", padding: "10px 14px", borderRadius: "10px", color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", transition: "all 0.2s", fontWeight: 500 }}
              >
                {item.label}
              </Link>
            ))}
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
        <main style={{ flex: 1, padding: "40px", overflowX: "hidden", background: "var(--dark-bg)" }}>
          {children}
        </main>
      </div>
    </>
  );
}
