"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/CartContext";

const CATEGORY_LABELS: Record<string, string> = {
  all:         "Tất cả",
  panels:      "Tấm Pin Mặt trời",
  inverters:   "Biến tần - Inverter",
  batteries:   "Pin Lưu Trữ",
  accessories: "Phụ Kiện Lắp đặt",
};

const CATEGORY_ICONS: Record<string, string> = {
  all:         "🔆",
  panels:      "☀️",
  inverters:   "⚡",
  batteries:   "🔋",
  accessories: "🔩",
};

interface Props {
  products: any[];
  initialCategory: string;
  customerSession: { name: string; email: string } | null;
}

export default function SanPhamClient({ products, initialCategory, customerSession }: Props) {
  const router = useRouter();
  const { addToCart, totalItems } = useCart();
  const [filter, setFilter] = useState(initialCategory);
  const [addedId, setAddedId] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync filter with URL
  const setCategory = (cat: string) => {
    setFilter(cat);
    const url = cat === "all" ? "/san-pham" : `/san-pham?danh-muc=${encodeURIComponent(cat)}`;
    router.push(url, { scroll: false });
  };

  const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));

  // Filter + search
  let displayed = filter === "all" ? products : products.filter((p) => p.category === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    displayed = displayed.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.specs ?? "").toLowerCase().includes(q)
    );
  }
  // Sort
  if (sort === "price-asc") displayed = [...displayed].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") displayed = [...displayed].sort((a, b) => b.price - a.price);
  else displayed = [...displayed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      {/* Navbar */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="navbar">
        <div className="container nav-container">
          {/* Hamburger — left on mobile, hidden on desktop */}
          <button
            className={`hamburger ${isMenuOpen ? "open" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isMenuOpen}
          >
            <span style={{ transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none', transition: '0.3s' }}></span>
            <span style={{ opacity: isMenuOpen ? 0 : 1, transition: '0.3s' }}></span>
            <span style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none', transition: '0.3s' }}></span>
          </button>

          {/* Logo — center on mobile, left on desktop */}
          <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>

          <ul className={`nav-links ${isMenuOpen ? "active" : ""}`} id="nav-links">
            <li><a href="/#services" onClick={() => setIsMenuOpen(false)}>Dịch Vụ</a></li>
            <li><Link href="/san-pham" onClick={() => setIsMenuOpen(false)} style={{ color: "var(--primary)", fontWeight: 700 }}>Sản Phẩm</Link></li>
            <li><a href="/#process" onClick={() => setIsMenuOpen(false)}>Quy Trình</a></li>
            <li><Link href="/du-an" onClick={() => setIsMenuOpen(false)}>Đăng Ký Dự Án</Link></li>
            <li><a href="/#calculator" onClick={() => setIsMenuOpen(false)}>Báo Giá</a></li>
            <li><a href="/#contact" onClick={() => setIsMenuOpen(false)}>Liên Hệ</a></li>
            {/* Auth links inside mobile menu only */}
            {customerSession ? (
              <li className="nav-mobile-auth" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px', marginTop: '4px' }}>
                <Link href="/tai-khoan" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--primary)', fontWeight: 600 }}>👤 Tài khoản</Link>
              </li>
            ) : (
              <>
                <li className="nav-mobile-auth" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px', marginTop: '4px' }}>
                  <Link href="/dang-nhap" onClick={() => setIsMenuOpen(false)}>Đăng nhập</Link>
                </li>
                <li className="nav-mobile-auth">
                  <Link href="/dang-ky" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--primary)', fontWeight: 600 }}>Đăng ký</Link>
                </li>
              </>
            )}
          </ul>

          {/* Right side: cart + auth buttons */}
          <div className="nav-right-group">
            <Link href="/cart" style={{ position: "relative", color: "var(--text)", textDecoration: "none", fontSize: "1.4rem", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "44px", minHeight: "44px" }} title="Giỏ hàng">
              🛒
              {totalItems > 0 && (
                <span style={{ position: "absolute", top: "0px", right: "0px", background: "var(--primary)", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
            
            <div className="nav-auth-buttons" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {customerSession ? (
                <Link href="/tai-khoan" style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", padding: "6px 14px", color: "var(--primary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
                  👤 {customerSession.name.split(" ").pop()}
                </Link>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link href="/dang-nhap" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontWeight: 500 }}>Đăng nhập</Link>
                  <Link href="/dang-ky" className="nav-signup-btn" style={{ color: "var(--primary)", textDecoration: "none", fontSize: "0.85rem", padding: "6px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid transparent", fontWeight: 600 }}>Đăng ký</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu close overlay button */}
      {isMenuOpen && (
        <button
          className="mobile-menu-close"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Đóng menu"
        >✕</button>
      )}

      {/* Hero Banner */}
      <section style={{ paddingTop: "80px", background: "linear-gradient(135deg, #f0fdf4 0%, #fff 100%)", borderBottom: "1px solid rgba(16,185,129,0.15)" }}>
        <div className="container" style={{ padding: "36px 20px 28px" }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: "12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Trang chủ</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: "var(--primary)" }}>Sản Phẩm</span>
            {filter !== "all" && (
              <>
                <span style={{ margin: "0 8px" }}>›</span>
                <span style={{ color: "var(--accent)" }}>{CATEGORY_LABELS[filter] ?? filter}</span>
              </>
            )}
          </div>

          <h1 style={{ color: "var(--accent)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", marginBottom: "6px" }}>
            {filter === "all" ? "Tất cả Sản Phẩm" : `${CATEGORY_ICONS[filter] ?? ""} ${CATEGORY_LABELS[filter] ?? filter}`}
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "0.95rem" }}>
            Thiết bị điện mặt trời chính hãng từ các thương hiệu hàng đầu thế giới
          </p>

          {/* Search + Sort bar */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1rem" }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "11px 14px 11px 40px", background: "#fff", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "10px", color: "var(--text)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ padding: "11px 14px", background: "#fff", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "10px", color: "var(--text)", fontSize: "0.9rem", cursor: "pointer" }}
            >
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>
        </div>
      </section>

      {/* ===== MOBILE CATEGORY CHIPS (hidden on desktop) ===== */}
      <div className="mobile-cat-bar">
        <button
          onClick={() => setCategory("all")}
          className={`mobile-cat-chip ${filter === "all" ? "active" : ""}`}
        >
          <span className="chip-icon">🔆</span>
          <span className="chip-label">Tất cả</span>
          <span className="chip-count">{products.length}</span>
        </button>
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`mobile-cat-chip ${filter === cat ? "active" : ""}`}
          >
            <span className="chip-icon">{CATEGORY_ICONS[cat] ?? "📦"}</span>
            <span className="chip-label">{CATEGORY_LABELS[cat] ?? cat}</span>
            <span className="chip-count">{products.filter((p) => p.category === cat).length}</span>
          </button>
        ))}
      </div>

      {/* Main Layout: Sidebar (desktop) + Products */}
      <div className="container sp-layout">

        {/* Desktop Sidebar: Category Filter */}
        <aside className="sp-sidebar">
          <h3 style={{ color: "var(--accent)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "16px", fontWeight: 700 }}>Danh mục</h3>
          <div className="category-list">
            <button onClick={() => setCategory("all")} className={`category-btn ${filter === "all" ? "active" : ""}`}>
              <span>🔆 Tất cả</span>
              <span className="badge-count">{products.length}</span>
            </button>
            {uniqueCategories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              const active = filter === cat;
              return (
                <button key={cat} onClick={() => setCategory(cat)} className={`category-btn ${active ? "active" : ""}`}>
                  <span>{CATEGORY_ICONS[cat] ?? "📦"} {CATEGORY_LABELS[cat] ?? cat}</span>
                  <span className="badge-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="support-box" style={{ marginTop: "28px", padding: "16px", background: "rgba(16,185,129,0.06)", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.15)" }}>
            <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem", marginBottom: "6px" }}>💡 Cần tư vấn?</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>Gọi ngay để được tư vấn miễn phí từ chuyên gia</p>
            <a href="tel:19001234" style={{ display: "block", marginTop: "10px", color: "var(--accent)", fontWeight: 700, textDecoration: "none", fontSize: "1rem" }}>📞 1900 1234</a>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="sp-main">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Hiển thị <strong style={{ color: "var(--accent)" }}>{displayed.length}</strong> sản phẩm
              {search && <> cho "<strong style={{ color: "var(--primary)" }}>{search}</strong>"</>}
            </p>
          </div>

          {displayed.length === 0 ? (
            <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔍</div>
              <h3 style={{ color: "var(--accent)", marginBottom: "8px" }}>Không tìm thấy sản phẩm</h3>
              <p>Thử tìm kiếm khác hoặc <button onClick={() => { setSearch(""); setCategory("all"); }} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }}>xem tất cả sản phẩm</button></p>
            </div>
          ) : (
            <div className="products-grid">
              {displayed.map((p) => {
                let images: string[] = [];
                try { images = JSON.parse(p.images); } catch {}
                const thumb = images[0] ?? "";
                const isAdded = addedId === p.id;

                return (
                  <div className="product-card" key={p.id} style={{ display: "flex", flexDirection: "column" }}>
                    <Link href={`/products/${p.id}`} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <div className="product-img">
                        {thumb
                          ? <img src={thumb} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div className="product-emoji">📦</div>
                        }
                      </div>
                      {/* Category badge */}
                      <div style={{ padding: "8px 16px 0" }}>
                        <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", color: "var(--primary)", fontWeight: 600 }}>
                          {CATEGORY_ICONS[p.category]} {CATEGORY_LABELS[p.category] ?? p.category}
                        </span>
                      </div>
                      <div className="product-info" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <h3 style={{ transition: "color .2s" }}>{p.name}</h3>
                        <p className="specs" style={{ flex: 1 }}>{p.specs || "Chính hãng, bảo hành 12 năm"}</p>
                        <div className="product-price" style={{ marginTop: "auto" }}>
                          <span className="price">{new Intl.NumberFormat("vi-VN").format(p.price)}đ</span>
                          <span className="product-btn">Xem chi tiết</span>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart({ id: p.id, name: p.name, price: p.price, image: thumb });
                        setAddedId(p.id);
                        setTimeout(() => setAddedId(null), 1500);
                      }}
                      style={{ margin: "0 16px 16px", padding: "10px", borderRadius: "10px", background: isAdded ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.15)", color: isAdded ? "var(--primary)" : "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", transition: "all 0.3s ease", border: "1px solid rgba(16,185,129,0.3)" }}
                    >
                      {isAdded ? "✅ Đã thêm vào giỏ!" : "🛒 Thêm vào giỏ"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: "40px" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <Link href="/" className="nav-logo" style={{ fontSize: "1.4rem" }}>Kaido <span>Solar</span></Link>
            <div style={{ display: "flex", gap: "24px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              <a href="tel:19001234" style={{ color: "var(--text-muted)", textDecoration: "none" }}>📞 1900 1234</a>
              <a href="mailto:info@kaidosolar.vn" style={{ color: "var(--text-muted)", textDecoration: "none" }}>📧 info@kaidosolar.vn</a>
            </div>
          </div>
          <div className="footer-bottom" style={{ marginTop: "24px" }}>
            <p>© 2024 Kaido Solar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
