"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { useState } from "react";
import AiAssistant from "./AiAssistant";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Tổng quan", path: "/admin", icon: "📊" },
    { 
      name: "Sản phẩm", 
      icon: "📦", 
      path: "/admin/products",
      children: [
        { name: "Danh sách sản phẩm", path: "/admin/products" },
        { name: "Quản lý kho", path: "/admin/inventory" },
        { name: "Nhập hàng", path: "/admin/inventory/import" }
      ]
    },
    { name: "Yêu cầu báo giá", path: "/admin/orders", icon: "🛒" },
    { name: "Bán hàng", path: "/admin/sales", icon: "🛍️" },
    { name: "Quản lý Dự án", path: "/admin/projects", icon: "🏗️" },
    { name: "Nhà cung cấp", path: "/admin/suppliers", icon: "🏢" },
    { name: "Thợ lắp đặt", path: "/admin/installers", icon: "👷" },
    { name: "Kênh vận chuyển", path: "/admin/shipping", icon: "🚚" },
    { name: "Khách hàng", path: "/admin/customers", icon: "👥" },
    { name: "Về trang web", path: "/", icon: "🌍" },
    {
      name: "Marketing",
      icon: "📣",
      path: "/admin/marketing",
      children: [
        { name: "Group Facebook / Zalo", path: "/admin/marketing/groups" },
        { name: "🎯 Lead Scanner AI", path: "/admin/marketing/leads" },
        { name: "👤 Liên hệ Đối thủ / CTV", path: "/admin/marketing/prospects" },
      ]
    },
  ];

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(pathname.includes("/admin/products") || pathname.includes("/admin/inventory"));
  const [marketingMenuOpen, setMarketingMenuOpen] = useState(pathname.includes("/admin/marketing"));

  const menuStates: Record<string, [boolean, (v: boolean) => void]> = {
    "Sản phẩm": [productMenuOpen, setProductMenuOpen],
    "Marketing": [marketingMenuOpen, setMarketingMenuOpen],
  };

  return (
    <>
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ padding: "32px 24px", borderBottom: "1px solid var(--border)" }}>
          <div className="brand" style={{ fontSize: "1.8rem", color: "#0F172A" }}>
            Kaido <span style={{ color: "var(--primary)" }}>Admin</span>
          </div>
        </div>
        <ul className="nav-menu">
          {navItems.map((item) => {
            const isActive = item.path && (pathname === item.path || (item.path !== "/admin" && item.path !== "/" && pathname.startsWith(item.path)));
            const isProductMenu = item.name === "Sản phẩm";
            const productActive = isProductMenu && (pathname.startsWith("/admin/products") || pathname.startsWith("/admin/inventory"));

            if (item.children) {
              const basePath = item.path || "";
              const [menuOpen, setMenuOpen] = menuStates[item.name] || [false, () => {}];
              const isMenuActive = basePath && pathname.startsWith(basePath);
              return (
                <li key={item.name}>
                  <div 
                    className={`nav-item ${isMenuActive ? "active" : ""}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                      fontSize: "1.05rem",
                      padding: "16px 24px",
                      fontWeight: isMenuActive ? 600 : 400,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "1.2rem", width: "24px", display: "inline-block" }}>{item.icon}</span> 
                      {item.name}
                    </div>
                    <span style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▼</span>
                  </div>
                  
                  {menuOpen && (
                    <ul style={{ listStyle: "none", padding: "0 0 0 48px", margin: 0 }}>
                      {item.children.map(child => {
                        const isChildActive = pathname === child.path || pathname.startsWith(child.path + "/");
                        return (
                          <li key={child.name}>
                            <Link 
                              href={child.path} 
                              onClick={() => setSidebarOpen(false)}
                              style={{
                                display: "block",
                                padding: "10px 16px",
                                color: isChildActive ? "var(--primary)" : "var(--text-muted)",
                                textDecoration: "none",
                                fontSize: "0.95rem",
                                fontWeight: isChildActive ? 600 : 400
                              }}
                            >
                              {child.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.name}>
                <Link 
                  href={item.path as string} 
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    fontSize: "1.05rem",
                    padding: "16px 24px",
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  <span style={{ fontSize: "1.2rem", width: "24px", display: "inline-block" }}>{item.icon}</span> 
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="main-content">
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="mobile-menu-btn" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ☰
            </button>
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>Quản trị hệ thống</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="topbar-avatar" style={{ width: '36px', height: '36px', background: 'var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>A</div>
            <form action={logout}>
              <button type="submit" style={{ padding: '8px 14px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', minHeight: '36px' }}>
                <span>🚪</span>
                <span className="logout-text">Đăng xuất</span>
              </button>
            </form>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
    <AiAssistant />
    </>
  );
}
