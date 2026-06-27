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

  // Form state
  const [bill, setBill] = useState(1500000);
  const [usageTime, setUsageTime] = useState<'day' | 'night' | 'both'>('day');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
            <div className="hero-badge">⚡ Tiền điện càng cao, lắp điện mặt trời càng đáng</div>
            <h1>Giảm Tiền Điện Mỗi Tháng Với <span className="highlight">Điện Mặt Trời</span></h1>
            <p>Kaido Solar tư vấn giải pháp hòa lưới, hybrid và lưu trữ theo đúng nhu cầu thực tế — tính toán rõ ràng chi phí, sản lượng và thời gian hoàn vốn để bạn yên tâm đầu tư lâu dài.</p>
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
              <div className="stat-number" data-target="200" data-suffix="+">0</div>
              <div className="stat-label">Dự án đã tư vấn &amp; triển khai</div>
            </div>
            <div className="stat-item reveal">
              <div className="stat-number" data-target="5" data-suffix=" MWp+">0</div>
              <div className="stat-label">Tổng công suất hệ thống</div>
            </div>
            <div className="stat-item reveal">
              <div className="stat-number" data-target="300" data-suffix="+">0</div>
              <div className="stat-label">Khách hàng đã phục vụ</div>
            </div>
            <div className="stat-item reveal">
              <div className="stat-number" data-target="5" data-suffix="+ Năm">0</div>
              <div className="stat-label">Kinh nghiệm kỹ thuật</div>
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

      <section className="section" id="products" style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header reveal">
            <div className="accent-line"></div>
            <h2>Giải Pháo Thiết Bị Năng Lượng</h2>
            <p>Hệ thống sản phẩm chính hãng, hiệu suất cao đạt tiêu chuẩn kiểm định quốc tế</p>
          </div>

          {/* Category Cards → navigate to /san-pham */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            {[
              { key: 'all',         icon: '🌿', label: 'Tất cả sản phẩm',       desc: `Tổng số ${products.length} dòng sản phẩm`,                         color: '#059669' },
              { key: 'panels',      icon: '☀️', label: 'Tấm Pin Mặt trời',       desc: `${products.filter(p=>p.category==='panels').length} sản phẩm cao cấp`,      color: '#F59E0B' },
              { key: 'inverters',   icon: '⚡', label: 'Biến tần - Inverter',    desc: `${products.filter(p=>p.category==='inverters').length} dòng thiết bị`,   color: '#0284C7' },
              { key: 'batteries',   icon: '🔋', label: 'Pin Lưu Trữ Lithium',    desc: `${products.filter(p=>p.category==='batteries').length} module lưu trữ`,   color: '#10B981' },
              { key: 'accessories', icon: '🔩', label: 'Vật Tư Thi Công',        desc: `${products.filter(p=>p.category==='accessories').length} phụ kiện đồng bộ`, color: '#64748B' },
            ].filter(c => c.key === 'all' || products.some(p => p.category === c.key)).map(cat => (
              <Link
                key={cat.key}
                href={cat.key === 'all' ? '/san-pham' : `/san-pham?danh-muc=${cat.key}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="reveal"
                  style={{
                    background: '#F8FAFC',
                    border: `1px solid var(--border)`,
                    borderRadius: 'var(--radius)',
                    padding: '32px 24px',
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(15, 23, 42, 0.01)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.transform = 'translateY(-4px)';
                    el.style.borderColor = cat.color;
                    el.style.background = '#FFFFFF';
                    el.style.boxShadow = `0 12px 30px ${cat.color}15`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.transform = 'translateY(0)';
                    el.style.borderColor = 'var(--border)';
                    el.style.background = '#F8FAFC';
                    el.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{cat.icon}</div>
                  <h3 style={{ color: 'var(--accent)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>{cat.label}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>{cat.desc}</p>
                  <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: cat.color, fontSize: '0.88rem', fontWeight: 700 }}>
                    Khám phá ngay →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Preview: latest products */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }} className="reveal">
            <span style={{ background: 'rgba(5, 150, 105, 0.08)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700 }}>
              SẢN PHẨM KHUYÊN DÙNG
            </span>
          </div>
          <div className="products-grid">
            {products.slice(0, 4).map(p => {
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
                      <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                        {CATEGORY_LABELS[p.category] || p.category}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', lineHeight: '1.4', margin: '0 0 12px 0', fontWeight: 700 }}>{p.name}</h3>
                      <div className="product-price" style={{ marginTop: 'auto' }}>
                        <span className="price">{new Intl.NumberFormat('vi-VN').format(p.price)}đ</span>
                      </div>
                    </div>
                  </Link>
                  <button onClick={handleAddToCart} style={{ margin: '0 16px 16px', padding: '12px', borderRadius: '12px', background: isAdded ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.06)', color: isAdded ? 'var(--primary)' : 'var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s ease', border: '1px solid rgba(5, 150, 105, 0.15)' }}>
                    {isAdded ? '✅ Đã thêm vào giỏ!' : '🛒 Thêm vào giỏ'}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }} className="reveal">
            <Link href="/san-pham" className="btn btn-primary" style={{ fontSize: '0.95rem', padding: '14px 36px' }}>
              Xem toàn bộ sản phẩm thiết bị →
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

      <section className="section" id="calculator" style={{ background: '#F8FAFC' }}>
        <div className="container">
          <div className="section-header reveal">
            <div className="accent-line"></div>
            <h2>Ước Tính Sản Lượng & Tiết Kiệm</h2>
            <p>Hệ thống tự động tính toán cấu hình hệ thống điện mặt trời và số tiền tiết kiệm tối ưu dựa trên hóa đơn điện của bạn</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            maxWidth: '1100px',
            margin: '0 auto',
            alignItems: 'start'
          }} className="reveal">

            {/* Left side: Calculator controls and customer info */}
            <div className="calculator" style={{ width: '100%', margin: 0 }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Đã nhận thông tin!</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Kaido Solar sẽ liên hệ với bạn trong vòng 30 phút để cung cấp báo giá chi tiết và thiết kế 3D miễn phí.</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: '24px', padding: '12px 32px' }}
                    onClick={() => { setSubmitted(false); setPhone(''); setProvince(''); setWard(''); }}
                  >
                    Tạo yêu cầu mới
                  </button>
                </div>
              ) : (
                <form action={async (formData) => {
                  const res = await submitQuoteRequest(formData);
                  if (res.success) { setSubmitted(true); }
                  else alert('Có lỗi xảy ra, vui lòng thử lại.');
                }}>

                  {/* Bill Slider */}
                  <div className="form-group">
                    <label className="quote-bill-label">
                      <span>💡 Tiền điện trung bình hàng tháng</span>
                      <span style={{
                        background: 'var(--gradient)',
                        color: '#fff',
                        padding: '4px 14px',
                        borderRadius: '20px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        letterSpacing: '0.3px',
                        boxShadow: '0 4px 10px rgba(5, 150, 105, 0.15)'
                      }}>
                        {new Intl.NumberFormat('vi-VN').format(bill)}đ
                      </span>
                    </label>
                    <input
                      type="range"
                      name="bill"
                      min={500000}
                      max={15000000}
                      step={250000}
                      value={bill}
                      onChange={e => setBill(Number(e.target.value))}
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        accentColor: 'var(--primary)',
                        height: '6px',
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
                      <span>500k</span>
                      <span>3 triệu</span>
                      <span>6 triệu</span>
                      <span>10 triệu</span>
                      <span>15 triệu+</span>
                    </div>
                  </div>

                  {/* Day/Night Usage */}
                  <div className="form-group">
                    <label>⏰ Khung giờ dùng điện nhiều nhất</label>
                    <div className="quote-usage-grid">
                      {([
                        { value: 'day',   icon: '☀️', label: 'Ban ngày nhiều', desc: 'Hòa lưới trực tiếp' },
                        { value: 'both',  icon: '🌤️', label: 'Cả ngày lẫn đêm', desc: 'Hybrid lưu trữ nhẹ' },
                        { value: 'night', icon: '🌙', label: 'Ban đêm nhiều', desc: 'Hybrid lưu trữ lớn' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`quote-usage-btn ${usageTime === opt.value ? 'active' : ''}`}
                          onClick={() => setUsageTime(opt.value)}
                        >
                          <div className="quote-usage-icon">{opt.icon}</div>
                          <div>
                            <div className="quote-usage-label">{opt.label}</div>
                            <div className="quote-usage-desc">{opt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <input type="hidden" name="usageTime" value={usageTime} />
                  </div>

                  {/* Name */}
                  <div className="form-group">
                    <label>👤 Họ và Tên của bạn *</label>
                    <input type="text" name="name" placeholder="Nhập họ và tên" required />
                  </div>

                  {/* Phone */}
                  <div className="form-group">
                    <label>📱 Số điện thoại liên hệ *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại để nhận kết quả phân tích"
                      required
                    />
                  </div>

                  {/* Province + Ward */}
                  <div className="quote-location-grid">
                    <div className="form-group">
                      <label>🗺️ Tỉnh / Thành phố</label>
                      <input
                        type="text"
                        name="province"
                        value={province}
                        onChange={e => setProvince(e.target.value)}
                        placeholder="VD: Hà Nội"
                      />
                    </div>
                    <div className="form-group">
                      <label>🏘️ Quận / Huyện / Xã</label>
                      <input
                        type="text"
                        name="ward"
                        value={ward}
                        onChange={e => setWard(e.target.value)}
                        placeholder="VD: Cầu Giấy"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
                  >
                    📩 Gửi Thiết Kế & Báo Giá 3D Miễn Phí
                  </button>
                </form>
              )}
            </div>

            {/* Right side: Live Calculated Energy Dashboard */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '36px',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.03)',
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Phân Tích Hệ Thống Ước Tính
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>Số liệu tính toán dựa trên hóa đơn điện thực tế của hộ gia đình Việt Nam</p>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                
                {/* System size */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Công suất khuyến nghị</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {Math.max(3, Math.round((bill / 200000) * 10) / 10)} kWp
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem' }}>🔆</div>
                </div>

                {/* Estimated savings */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#F0F9FF', borderRadius: '12px', borderLeft: '4px solid var(--sky-blue)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--sky-blue)', fontWeight: 600, display: 'block' }}>Tiết kiệm cả đời (25 năm)</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--sky-blue)' }}>
                      ~{new Intl.NumberFormat('vi-VN').format(Math.round((bill * 12 * 25 * 0.85) / 1000000) * 1000000)}đ
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem' }}>📈</div>
                </div>

                {/* CO2 reduction */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(5, 150, 105, 0.04)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'block' }}>Lượng CO2 giảm thiểu</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ~{new Intl.NumberFormat('vi-VN').format(Math.round((bill / 2000) * 12 * 0.8 * 25))} kg CO2/Năm
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem' }}>🌳</div>
                </div>

                {/* Technical specifics visual */}
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent)', display: 'block', marginBottom: '12px' }}>
                    Yêu cầu không gian lắp đặt:
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ background: '#F8FAFC', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🏠</div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                      Diện tích mái cần thiết: <strong>~{Math.round(Math.max(3, (bill / 200000)) * 6.5)} m²</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#F8FAFC', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📦</div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                      Số lượng tấm pin (loại 550Wp): <strong>~{Math.max(6, Math.ceil((bill / 200000) * 1.8))} tấm</strong>
                    </span>
                  </div>
                </div>

              </div>
            </div>

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
                <li><span style={{ color: 'var(--primary)' }}>📞</span> 0789.96.8888 - 0901.096.096</li>
                <li><span style={{ color: 'var(--primary)' }}>📧</span> info@kaidosolar.com</li>
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
