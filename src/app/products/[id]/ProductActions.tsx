"use client";

import { useCart } from "@/lib/CartContext";
import Link from "next/link";
import { useState } from "react";

interface Props {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    specs: string;
  };
}

export default function ProductActions({ product }: Props) {
  const { addToCart, totalItems } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="pd-actions" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <button
        onClick={handleAddToCart}
        style={{
          padding: "16px 24px",
          borderRadius: "12px",
          border: "2px solid rgba(16,185,129,0.5)",
          background: added ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.08)",
          color: added ? "var(--primary)" : "var(--accent)",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "1rem",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {added ? "✅ Đã thêm vào giỏ hàng!" : "🛒 Thêm vào giỏ hàng"}
      </button>

      <Link href="/cart" className="btn btn-primary pd-btn" style={{ textAlign: "center", justifyContent: "center" }}>
        ⚡ Mua ngay → Xem giỏ hàng
        {totalItems > 0 && (
          <span style={{ marginLeft: "8px", background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: "22px", height: "22px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 900 }}>
            {totalItems}
          </span>
        )}
      </Link>

      <Link href="/#calculator" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "underline" }}>
        Nhận tư vấn & báo giá lắp đặt →
      </Link>
    </div>
  );
}
