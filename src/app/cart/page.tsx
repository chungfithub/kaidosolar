"use client";

import { useCart } from "@/lib/CartContext";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { items, removeFromCart, updateQty, totalPrice, clearCart } = useCart();
  const [removed, setRemoved] = useState<number | null>(null);

  const handleRemove = (id: number) => {
    setRemoved(id);
    setTimeout(() => {
      removeFromCart(id);
      setRemoved(null);
    }, 300);
  };

  if (items.length === 0) {
    return (
      <>
        <nav className="navbar scrolled">
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
            <ul className="nav-links">
              <li><Link href="/#products">← Tiếp tục mua sắm</Link></li>
            </ul>
          </div>
        </nav>
        <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "5rem" }}>🛒</div>
          <h2 style={{ color: "var(--accent)", fontSize: "1.8rem" }}>Giỏ hàng của bạn đang trống</h2>
          <p>Hãy khám phá các sản phẩm điện mặt trời của chúng tôi!</p>
          <Link href="/#products" className="btn btn-primary">Xem Sản Phẩm</Link>
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
            <li><Link href="/#products">← Tiếp tục mua sắm</Link></li>
          </ul>
        </div>
      </nav>

      <div className="product-detail-page">
        <div className="pd-container" style={{ maxWidth: "900px" }}>
          <div className="pd-breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span style={{ margin: "0 8px" }}>/</span>
            <span style={{ color: "var(--text)" }}>Giỏ hàng</span>
          </div>

          <h1 style={{ color: "var(--accent)", marginBottom: "32px", fontSize: "2rem" }}>
            🛒 Giỏ hàng của bạn
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>
            {/* Cart Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {items.map((item) => {
                let imgSrc = item.image;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--dark-surface)",
                      borderRadius: "16px",
                      padding: "20px",
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                      border: "1px solid rgba(16,185,129,0.1)",
                      opacity: removed === item.id ? 0 : 1,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {/* Image */}
                    <div style={{ width: "80px", height: "80px", borderRadius: "12px", overflow: "hidden", background: "var(--dark-bg)", flexShrink: 0 }}>
                      {imgSrc ? (
                        <img src={imgSrc} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: "var(--text)", fontSize: "1rem", marginBottom: "8px" }}>{item.name}</h3>
                      <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: "1.1rem" }}>
                        {new Intl.NumberFormat("vi-VN").format(item.price)}đ
                      </div>
                    </div>

                    {/* Quantity Control */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(16,185,129,0.4)", background: "transparent", color: "var(--primary)", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >−</button>
                      <span style={{ color: "var(--text)", fontWeight: 700, minWidth: "24px", textAlign: "center" }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(16,185,129,0.4)", background: "transparent", color: "var(--primary)", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >+</button>
                    </div>

                    {/* Subtotal */}
                    <div style={{ textAlign: "right", minWidth: "120px" }}>
                      <div style={{ color: "var(--accent)", fontWeight: 700 }}>
                        {new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)}đ
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem" }}
                    >Xóa</button>
                  </div>
                );
              })}

              <button
                onClick={clearCart}
                style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem", textDecoration: "underline" }}
              >Xóa tất cả</button>
            </div>

            {/* Order Summary */}
            <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(16,185,129,0.2)", position: "sticky", top: "100px" }}>
              <h3 style={{ color: "var(--accent)", marginBottom: "24px", fontSize: "1.2rem" }}>Tóm tắt đơn hàng</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>{new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)}đ</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(16,185,129,0.2)", paddingTop: "20px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text)", fontWeight: 700, fontSize: "1.1rem" }}>
                  <span>Tổng cộng:</span>
                  <span style={{ color: "var(--primary)" }}>{new Intl.NumberFormat("vi-VN").format(totalPrice)}đ</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "8px" }}>
                  * Giá chưa bao gồm phí vận chuyển và lắp đặt
                </p>
              </div>

              <div style={{ padding: "14px 16px", background: "rgba(16,185,129,0.08)", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.2)", marginBottom: "20px" }}>
                <p style={{ color: "var(--primary)", fontSize: "0.85rem", textAlign: "center" }}>
                  💬 Thanh toán khi nhận hàng (COD)<br/>
                  <span style={{ color: "var(--text-muted)" }}>Chúng tôi sẽ liên hệ xác nhận đơn</span>
                </p>
              </div>

              <Link href="/checkout" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
                Đặt Hàng Ngay →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
