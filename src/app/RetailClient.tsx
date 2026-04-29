"use client";

import { useState, useEffect } from "react";
import { submitQuoteRequest } from "./actions/order";
import Link from 'next/link';
import { useCart } from "@/lib/CartContext";

interface Props {
  products: any[];
  customerSession: { name: string; email: string } | null;
}

export default function RetailClient({ products, customerSession }: Props) {
  const { addToCart, totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const [addedId, setAddedId] = useState<number | null>(null);

  // Calculator state
  const [bill, setBill] = useState(1500000);
  const [roofArea, setRoofArea] = useState(30);
  const [calcResult, setCalcResult] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Intersection Observer for Reveal Animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    
    // Counter Animation
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          if (target.dataset.target && !target.dataset.counted) {
            target.dataset.counted = "true";
            const max = parseInt(target.dataset.target);
            const suffix = target.dataset.suffix || "";
            let current = 0;
            const increment = max / 50;
            const timer = setInterval(() => {
              current += increment;
              if (current >= max) {
                target.innerText = max + suffix;
                clearInterval(timer);
              } else {
                target.innerText = Math.ceil(current) + suffix;
              }
            }, 30);
          }
        }
      });
    }, { threshold: 0.1 });
    
    counters.forEach(c => counterObserver.observe(c));
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  // Map DB category values → display labels
  const CATEGORY_LABELS: Record<string, string> = {
    panels:      'Tấm Pin Mặt trời',
    inverters:   'Biến tần - Inverter',
    batteries:   'Pin Lưu Trữ',
    accessories: 'Phụ Kiện Lắp đặt',
    // fallback for any Vietnamese keys already in DB
    'Tấm Pin Mặt trời': 'Tấm Pin Mặt trời',
    'Biến tần - Inverter': 'Biến tần - Inverter',
    'Pin Lưu Trữ': 'Pin Lưu Trữ',
    'Phụ Kiện': 'Phụ Kiện Lắp đặt',
    'accessories_install': 'Phụ Kiện Lắp đặt',
  };

  // Get distinct categories from actual products
  const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = filter === "all" ? products : products.filter(p => p.category === filter);

  const calculateSolar = () => {
    let systemSize = 0;
    if (bill <= 1000000) systemSize = 3;
    else if (bill <= 2000000) systemSize = 5;
    else if (bill <= 3000000) systemSize = 8;
    else if (bill <= 5000000) systemSize = 10;
    else systemSize = 15;

    const maxByRoof = Math.floor(roofArea / 5);
    if (systemSize > maxByRoof) systemSize = maxByRoof;

    const estimatedCost = systemSize * 14000000;
    const monthlySave = systemSize * 120 * 2500;

    setCalcResult({
      size: systemSize,
      cost: estimatedCost,
      save: monthlySave
    });
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="navbar">
        <div className="container nav-container">
          {/* Hamburger — left on mobile, hidden on desktop */}
          <button
            className={`hamburger ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isMenuOpen}
          >
            <span style={{ transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none', transition: '0.3s' }}></span>
            <span style={{ opacity: isMenuOpen ? 0 : 1, transition: '0.3s' }}></span>
            <span style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none', transition: '0.3s' }}></span>
          </button>

          {/* Logo — center on mobile, left on desktop */}
          <a href="#" className="nav-logo">Kaido <span>Solar</span></a>

          <ul className={`nav-links ${isMenuOpen ? "active" : ""}`} id="nav-links">
            <li><a href="#services" onClick={() => setIsMenuOpen(false)}>Dịch Vụ</a></li>
            <li><Link href="/san-pham" onClick={() => setIsMenuOpen(false)}>Sản Phẩm</Link></li>
            <li><a href="#process" onClick={() => setIsMenuOpen(false)}>Quy Trình</a></li>
            <li><Link href="/du-an" onClick={() => setIsMenuOpen(false)}>Đăng Ký Dự Án</Link></li>
            <li><a href="#calculator" onClick={() => setIsMenuOpen(false)}>Báo Giá</a></li>
            <li><a href="#contact" onClick={() => setIsMenuOpen(false)}>Liên Hệ</a></li>
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
            <Link
              href="/cart"
              style={{
                position: 'relative',
                color: scrolled ? 'var(--accent)' : '#ffffff',
                textDecoration: 'none',
                fontSize: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
                filter: scrolled ? 'none' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
              }}
              title="Giỏ hàng"
              aria-label="Giỏ hàng"
            >
              🛒
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: '0px', right: '0px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            <div className="nav-auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {customerSession ? (
                <Link
                  href="/tai-khoan"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: scrolled ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.15)',
                    border: scrolled ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '20px', padding: '6px 14px',
                    color: scrolled ? 'var(--primary)' : '#ffffff',
                    textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                  }}
                >
                  👤 {customerSession.name.split(' ').pop()}
                </Link>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/dang-nhap" style={{ color: scrolled ? 'var(--accent)' : 'rgba(255,255,255,0.9)', textDecoration: 'none', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '8px', border: scrolled ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.35)', fontWeight: 500 }}>Đăng nhập</Link>
                  <Link href="/dang-ky" className="nav-signup-btn" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', padding: '6px 14px', borderRadius: '8px', background: scrolled ? 'var(--primary)' : 'rgba(16,185,129,0.8)', fontWeight: 600 }}>Đăng ký</Link>
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

      <section className="hero" id="hero">
        <div className="hero-bg"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">☀️ Giải pháp năng lượng xanh #1 Việt Nam</div>
            <h1>Tiết Kiệm Chi Phí Điện Với <span className="highlight">Năng Lượng Mặt Trời</span></h1>
            <p>Kaido Solar cung cấp giải pháp điện mặt trời toàn diện cho hộ gia đình và doanh nghiệp. Tiết kiệm đến 90% hóa đơn tiền điện, bảo hành lên đến 25 năm.</p>
            <div className="hero-buttons">
              <a href="#calculator" className="btn btn-primary">⚡ Báo Giá Ngay</a>
              <a href="#services" className="btn btn-outline" style={{ color: 'white', borderColor: 'white' }}>Tìm Hiểu Thêm →</a>
            </div>

            {/* Hotline bar */}
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <a
                href="tel:07899688888"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  color: '#ffffff', textDecoration: 'none',
                  fontSize: '1rem', fontWeight: 600,
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(16,185,129,0.85)',
                  fontSize: '1rem',
                  animation: 'phonePulse 1.8s ease-in-out infinite',
                }}>📞</span>
                <span>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400, fontSize: '0.9rem' }}>Gọi ngay: </span>
                  <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.5px' }}>0789.96.8888</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400, fontSize: '0.85rem', marginLeft: '6px' }}>– Tư vấn miễn phí</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item reveal">
              <div className="stat-number" data-target="1500" data-suffix="+">0</div>
              <div className="stat-label">Dự án hoàn thành</div>
            </div>
            <div className="stat-item reveal">
              <div className="stat-number" data-target="50" data-suffix=" MWp">0</div>
              <div className="stat-label">Tổng công suất lắp đặt</div>
            </div>
            <div className="stat-item reveal">
              <div className="stat-number" data-target="1200" data-suffix="+">0</div>
              <div className="stat-label">Khách hàng tin tưởng</div>
            </div>
            <div className="stat-item reveal">
              <div className="stat-number" data-target="8" data-suffix=" Năm">0</div>
              <div className="stat-label">Kinh nghiệm</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <div className="section-header reveal">
            <div className="accent-line"></div>
            <h2>Dịch Vụ Của Chúng Tôi</h2>
            <p>Giải pháp năng lượng mặt trời toàn diện từ tư vấn đến bảo trì</p>
          </div>
          <div className="services-grid">
            <div className="service-card reveal">
              <div className="service-icon">📐</div>
              <h3>Tư Vấn & Thiết Kế</h3>
              <p>Khảo sát thực tế, tư vấn giải pháp tối ưu phù hợp nhu cầu sử dụng điện và ngân sách của bạn.</p>
            </div>
            <div className="service-card reveal">
              <div className="service-icon">🔧</div>
              <h3>Lắp Đặt Chuyên Nghiệp</h3>
              <p>Đội ngũ kỹ thuật viên giàu kinh nghiệm, thi công nhanh chóng, đảm bảo an toàn và chất lượng.</p>
            </div>
            <div className="service-card reveal">
              <div className="service-icon">🛡️</div>
              <h3>Bảo Trì & Bảo Dưỡng</h3>
              <p>Dịch vụ bảo trì định kỳ, vệ sinh tấm pin, kiểm tra hệ thống đảm bảo hiệu suất tối đa.</p>
            </div>
            <div className="service-card reveal">
              <div className="service-icon">📊</div>
              <h3>Giám Sát Hệ Thống</h3>
              <p>Hệ thống giám sát trực tuyến 24/7, theo dõi sản lượng điện và hiệu suất hoạt động real-time.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="products" style={{ background: 'var(--dark-surface)' }}>
        <div className="container">
          <div className="section-header reveal">
            <div className="accent-line"></div>
            <h2>Danh Mục Sản Phẩm</h2>
            <p>Thiết bị chính hãng từ các thương hiệu hàng đầu thế giới</p>
          </div>

          {/* Category Cards → navigate to /san-pham */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { key: 'all',         icon: '🔆', label: 'Tất cả sản phẩm',       desc: `${products.length} sản phẩm`,                                     color: '#10b981' },
              { key: 'panels',      icon: '☀️', label: 'Tấm Pin Mặt trời',       desc: `${products.filter(p=>p.category==='panels').length} sản phẩm`,      color: '#f59e0b' },
              { key: 'inverters',   icon: '⚡', label: 'Biến tần - Inverter',    desc: `${products.filter(p=>p.category==='inverters').length} sản phẩm`,   color: '#3b82f6' },
              { key: 'batteries',   icon: '🔋', label: 'Pin Lưu Trữ',            desc: `${products.filter(p=>p.category==='batteries').length} sản phẩm`,   color: '#8b5cf6' },
              { key: 'accessories', icon: '🔩', label: 'Phụ Kiện Lắp đặt',      desc: `${products.filter(p=>p.category==='accessories').length} sản phẩm`, color: '#06b6d4' },
            ].filter(c => c.key === 'all' || products.some(p => p.category === c.key)).map(cat => (
              <Link
                key={cat.key}
                href={cat.key === 'all' ? '/san-pham' : `/san-pham?danh-muc=${cat.key}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="reveal"
                  style={{
                    background: 'var(--dark-bg)',
                    border: `1px solid ${cat.color}30`,
                    borderRadius: '16px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.transform = 'translateY(-4px)';
                    el.style.borderColor = cat.color;
                    el.style.boxShadow = `0 8px 32px ${cat.color}25`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.transform = 'translateY(0)';
                    el.style.borderColor = `${cat.color}30`;
                    el.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>{cat.icon}</div>
                  <h3 style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{cat.label}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{cat.desc}</p>
                  <div style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: cat.color, fontSize: '0.85rem', fontWeight: 600 }}>
                    Xem ngay →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Preview: latest products */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sản phẩm nổi bật</p>
          </div>
          <div className="products-grid">
            {products.slice(0, 6).map(p => {
              let images: string[] = [];
              try { images = JSON.parse(p.images); } catch {}
              const thumb = images[0] ?? "";
              const isAdded = addedId === p.id;
              const handleAddToCart = (e: React.MouseEvent) => {
                e.preventDefault();
                addToCart({ id: p.id, name: p.name, price: p.price, image: thumb });
                setAddedId(p.id);
                setTimeout(() => setAddedId(null), 1500);
              };
              return (
                <div className="product-card reveal" key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <Link href={`/products/${p.id}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="product-img">
                      {thumb ? <img src={thumb} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="product-emoji">📦</div>}
                    </div>
                    <div className="product-info" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ transition: 'color .2s' }}>{p.name}</h3>
                      <p className="specs" style={{ flex: 1 }}>{p.specs || "Chính hãng, bảo hành 12 năm"}</p>
                      <div className="product-price" style={{ marginTop: 'auto' }}>
                        <span className="price">{new Intl.NumberFormat('vi-VN').format(p.price)}đ</span>
                      </div>
                    </div>
                  </Link>
                  <button onClick={handleAddToCart} style={{ margin: '0 16px 16px', padding: '10px', borderRadius: '10px', background: isAdded ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.15)', color: isAdded ? 'var(--primary)' : 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.3s ease', border: '1px solid rgba(16,185,129,0.3)' }}>
                    {isAdded ? '✅ Đã thêm vào giỏ!' : '🛒 Thêm vào giỏ'}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link href="/san-pham" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 36px' }}>
              Xem tất cả sản phẩm →
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="process">
        <div className="container">
          <div className="section-header reveal">
            <div className="accent-line"></div>
            <h2>Quy Trình Lắp Đặt</h2>
            <p>5 bước đơn giản để sở hữu hệ thống điện mặt trời</p>
          </div>
          <div className="process-timeline">
            <div className="process-step reveal">
              <div className="step-num">1</div>
              <h4>Khảo Sát</h4>
              <p>Đánh giá mái nhà, nhu cầu sử dụng điện và điều kiện lắp đặt</p>
            </div>
            <div className="process-step reveal">
              <div className="step-num">2</div>
              <h4>Thiết Kế</h4>
              <p>Thiết kế hệ thống tối ưu công suất và hiệu quả đầu tư</p>
            </div>
            <div className="process-step reveal">
              <div className="step-num">3</div>
              <h4>Báo Giá</h4>
              <p>Trình bày giải pháp, báo giá chi tiết vật tư và nhân công</p>
            </div>
            <div className="process-step reveal">
              <div className="step-num">4</div>
              <h4>Thi công</h4>
              <p>Lắp đặt thiết bị chuyên nghiệp, đấu nối hòa lưới nhanh chóng</p>
            </div>
            <div className="process-step reveal">
              <div className="step-num">5</div>
              <h4>Bàn giao</h4>
              <p>Nghiệm thu, hướng dẫn sử dụng và bàn giao tài khoản giám sát</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="calculator" style={{ background: 'var(--dark-surface)' }}>
        <div className="container">
          <div className="section-header reveal">
            <div className="accent-line"></div>
            <h2>Công Cụ Tính Toán Tiết Kiệm</h2>
            <p>Dự toán chi phí và sản lượng điện mặt trời cho mái nhà của bạn</p>
          </div>
          <div className="calculator reveal">
            <form action={async (formData) => {
              const res = await submitQuoteRequest(formData);
              if (res.success) alert(res.message);
            }}>
              <div className="form-group">
                <label>Tiền điện trung bình hàng tháng (VNĐ)</label>
                <input type="number" name="bill" value={bill} onChange={e => setBill(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Diện tích mái nhà khả dụng (m2)</label>
                <input type="number" name="roofArea" value={roofArea} onChange={e => setRoofArea(Number(e.target.value))} required />
              </div>
              <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '24px' }} onClick={calculateSolar}>
                🧮 Tính Toán Ngay
              </button>
              
              {calcResult && (
                <div className="calc-result" style={{ display: 'block' }}>
                  <h3>Cấu hình đề xuất: Hệ {calcResult.size} kWp</h3>
                  <p>Tiết kiệm dự kiến: <strong>{new Intl.NumberFormat('en-US').format(calcResult.save)}đ / tháng</strong></p>
                  <p>Chi phí đầu tư ước tính:</p>
                  <div className="result-price">{new Intl.NumberFormat('en-US').format(calcResult.cost)} VNĐ</div>
                  <hr style={{ margin: '20px 0', borderColor: 'rgba(16,185,129,0.2)' }} />
                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label>Họ và Tên *</label>
                    <input type="text" name="name" required />
                  </div>
                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label>Số điện thoại *</label>
                    <input type="tel" name="phone" required />
                  </div>
                  <div className="form-group" style={{ textAlign: 'left' }}>
                    <label>Khu vực lắp đặt</label>
                    <input type="text" name="address" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Gửi Yêu Cầu Báo Giá Chính Xác
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="nav-logo" style={{ fontSize: '1.4rem' }}>Kaido <span>Solar</span></a>
              <p>Tiên phong trong lĩnh vực điện năng lượng mặt trời tại Việt Nam. Cam kết chất lượng và dịch vụ bảo trì trọn đời.</p>
            </div>
            <div>
              <h4>Về Chúng Tôi</h4>
              <ul className="footer-links">
                <li><a href="#">Giới thiệu</a></li>
                <li><a href="#projects">Dự án tiêu biểu</a></li>
                <li><a href="#">Tin tức</a></li>
                <li><a href="#">Tuyển dụng</a></li>
              </ul>
            </div>
            <div>
              <h4>Dịch Vụ</h4>
              <ul className="footer-links">
                <li><a href="#services">Hộ gia đình</a></li>
                <li><a href="#services">Doanh nghiệp</a></li>
                <li><a href="#services">Bảo trì hệ thống</a></li>
                <li><a href="#calculator">Báo giá lắp đặt</a></li>
              </ul>
            </div>
            <div>
              <h4>Liên Hệ</h4>
              <ul className="footer-links">
                <li><span style={{ color: 'var(--primary)' }}>📞</span> 1900 1234</li>
                <li><span style={{ color: 'var(--primary)' }}>📧</span> info@kaidosolar.vn</li>
                <li><span style={{ color: 'var(--primary)' }}>📍</span> 123 Đường Điện Biên Phủ, Hà Nội</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Kaido Solar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
