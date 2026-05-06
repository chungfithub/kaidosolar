"use client";

import { useCart } from "@/lib/CartContext";
import { placeOrder } from "@/app/actions/order";
import Link from "next/link";
import { useState } from "react";

interface Props {
  prefill: { name: string; phone: string; address: string } | null;
  isLoggedIn: boolean;
}

export default function CheckoutClient({ prefill, isLoggedIn }: Props) {
  const { items, totalPrice, clearCart } = useCart();

  const [form, setForm] = useState({
    name: prefill?.name ?? "",
    phone: prefill?.phone ?? "",
    address: prefill?.address ?? "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderCode, setOrderCode] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { setError("Giỏ hàng của bạn đang trống!"); return; }
    setLoading(true);
    setError("");

    const result = await placeOrder(
      form,
      items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }))
    );

    if (result.success && result.orderCode) {
      clearCart();
      setOrderCode(result.orderCode);
    } else {
      setError(result.error || "Có lỗi xảy ra.");
    }
    setLoading(false);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (orderCode) {
    return (
      <>
        <nav className="navbar scrolled">
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
          </div>
        </nav>
        <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "5rem" }}>✅</div>
          <h1 style={{ color: "var(--primary)", fontSize: "2rem" }}>Đặt hàng thành công!</h1>
          <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "28px 40px", border: "1px solid rgba(16,185,129,0.3)" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>Mã đơn hàng của bạn:</p>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent)", letterSpacing: "3px" }}>{orderCode}</div>
          </div>
          <p style={{ color: "var(--text-muted)", maxWidth: "480px", lineHeight: 1.8 }}>
            Cảm ơn bạn đã tin tưởng Kaido Solar! 🙏<br />
            Chúng tôi sẽ <strong style={{ color: "var(--primary)" }}>liên hệ với bạn trong vòng 24 giờ</strong> để xác nhận đơn hàng và tư vấn chi tiết.
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/" className="btn btn-primary">Về trang chủ</Link>
            {isLoggedIn ? (
              <Link href="/tai-khoan/don-hang" className="btn btn-outline" style={{ color: "var(--primary)", borderColor: "rgba(16,185,129,0.4)" }}>
                📦 Xem đơn hàng của tôi
              </Link>
            ) : (
              <Link href="/san-pham" className="btn btn-outline" style={{ color: "var(--text)", borderColor: "rgba(255,255,255,0.2)" }}>
                Tiếp tục mua sắm
              </Link>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <>
        <nav className="navbar scrolled">
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
            <ul className="nav-links"><li><Link href="/cart">← Về giỏ hàng</Link></li></ul>
          </div>
        </nav>
        <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <div style={{ fontSize: "4rem" }}>🛒</div>
          <h2 style={{ color: "var(--accent)" }}>Giỏ hàng trống</h2>
          <Link href="/san-pham" className="btn btn-primary">Xem Sản Phẩm</Link>
        </div>
      </>
    );
  }

  // ── Checkout form ──────────────────────────────────────────────────────────
  return (
    <>
      <nav className="navbar scrolled">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
          <ul className="nav-links"><li><Link href="/cart">← Về giỏ hàng</Link></li></ul>
        </div>
      </nav>

      <div className="product-detail-page">
        <div className="pd-container" style={{ maxWidth: "900px" }}>
          <div className="pd-breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span style={{ margin: "0 8px" }}>/</span>
            <Link href="/cart">Giỏ hàng</Link>
            <span style={{ margin: "0 8px" }}>/</span>
            <span style={{ color: "var(--text)" }}>Thanh toán</span>
          </div>

          <h1 style={{ color: "var(--accent)", marginBottom: "32px", fontSize: "2rem" }}>
            📋 Thông tin đặt hàng
          </h1>

          {/* Logged-in notice */}
          {isLoggedIn && (
            <div style={{ marginBottom: "20px", padding: "12px 18px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.2rem" }}>✅</span>
              <span style={{ color: "var(--primary)", fontSize: "0.9rem", fontWeight: 600 }}>
                Đơn hàng sẽ được lưu vào tài khoản của bạn và có thể theo dõi tại{" "}
                <Link href="/tai-khoan/don-hang" style={{ color: "var(--accent)", textDecoration: "underline" }}>Tài khoản → Đơn hàng</Link>
              </span>
            </div>
          )}

          <div className="checkout-layout">
            {/* Customer Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(16,185,129,0.15)" }}>
                <h3 style={{ color: "var(--accent)", marginBottom: "20px", fontSize: "1.1rem" }}>👤 Thông tin khách hàng</h3>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Họ và tên *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Nguyễn Văn A" />
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="0901 234 567"
                    readOnly={isLoggedIn}
                    style={isLoggedIn ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                  />
                  {isLoggedIn && (
                    <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>SĐT từ tài khoản của bạn</small>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Địa chỉ giao hàng</label>
                  <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" />
                </div>

                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Yêu cầu đặc biệt, thời gian giao hàng..."
                    rows={3}
                    style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", color: "var(--text)", fontSize: "0.95rem", resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>
              </div>

              <div style={{ background: "rgba(16,185,129,0.06)", borderRadius: "12px", padding: "16px 20px", border: "1px solid rgba(16,185,129,0.2)" }}>
                <p style={{ color: "var(--primary)", fontWeight: 600, marginBottom: "4px" }}>💬 Hình thức thanh toán: COD</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Sau khi đặt hàng, nhân viên Kaido Solar sẽ liên hệ bạn trong vòng 24 giờ để xác nhận đơn và thống nhất thời gian giao hàng.</p>
              </div>

              {error && (
                <div style={{ padding: "14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", color: "#f87171", fontSize: "0.9rem" }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer", fontSize: "1.1rem", padding: "16px" }}
              >
                {loading ? "Đang xử lý..." : "✅ Xác nhận đặt hàng"}
              </button>
            </form>

            {/* Order Summary */}
            <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "28px", border: "1px solid rgba(16,185,129,0.2)", position: "sticky", top: "100px" }}>
              <h3 style={{ color: "var(--accent)", marginBottom: "20px", fontSize: "1.1rem" }}>🧾 Đơn hàng của bạn</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "50px", height: "50px", borderRadius: "8px", overflow: "hidden", background: "var(--dark-bg)", flexShrink: 0 }}>
                      {item.image
                        ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>📦</div>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--text)", fontSize: "0.85rem", marginBottom: "2px" }}>{item.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>× {item.quantity}</div>
                    </div>
                    <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem" }}>
                      {new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)}đ
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(16,185,129,0.2)", paddingTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem", color: "var(--text)" }}>
                  <span>Tổng cộng:</span>
                  <span style={{ color: "var(--primary)" }}>{new Intl.NumberFormat("vi-VN").format(totalPrice)}đ</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "8px" }}>* Chưa bao gồm phí vận chuyển</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
