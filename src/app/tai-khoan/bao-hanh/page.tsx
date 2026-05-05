import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

// Parse warranty string like "12 năm", "5 years", "25 năm" → number of years
function parseWarrantyYears(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

function getWarrantyStatus(expiryDate: Date | null): { label: string; color: string; icon: string; daysLeft: number | null } {
  if (!expiryDate) return { label: "Không xác định", color: "#6b7280", icon: "❓", daysLeft: null };
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { label: "Hết bảo hành", color: "#ef4444", icon: "🔴", daysLeft };
  if (daysLeft < 180) return { label: "Sắp hết hạn", color: "#f59e0b", icon: "🟡", daysLeft };
  return { label: "Đang bảo hành", color: "#10b981", icon: "🟢", daysLeft };
}

export default async function BaoHanhPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/dang-nhap");
  const session = await verifyCustomerToken(token);
  if (!session?.customerId) redirect("/dang-nhap");

  const orders = await prisma.order.findMany({
    where: {
      customerId: session.customerId as number,
      status: { not: "cancelled" },
    },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build warranty items list
  const warrantyItems = orders.flatMap((order) =>
    order.items.map((item) => {
      const warrantyText = item.warrantyNote ?? item.product.warranty;
      const years = parseWarrantyYears(warrantyText);
      const purchaseDate = order.createdAt;
      const expiryDate = years
        ? new Date(new Date(purchaseDate).setFullYear(new Date(purchaseDate).getFullYear() + years))
        : null;
      const status = getWarrantyStatus(expiryDate);

      let images: string[] = [];
      try { images = JSON.parse(item.product.images); } catch {}

      return {
        id: item.id,
        productName: item.product.name,
        category: item.product.category,
        image: images[0] ?? "",
        orderCode: order.orderCode,
        purchaseDate,
        warrantyText,
        years,
        expiryDate,
        status,
        quantity: item.quantity,
      };
    })
  ).filter(i => i.warrantyText);

  // Sort: active first, then expiring, then expired
  warrantyItems.sort((a, b) => {
    const order = { "🟢": 0, "🟡": 1, "🔴": 2, "❓": 3 };
    return (order[a.status.icon as keyof typeof order] ?? 3) - (order[b.status.icon as keyof typeof order] ?? 3);
  });

  const activeCount = warrantyItems.filter(i => i.status.icon === "🟢").length;
  const expiringCount = warrantyItems.filter(i => i.status.icon === "🟡").length;
  const expiredCount = warrantyItems.filter(i => i.status.icon === "🔴").length;

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "var(--accent)", fontSize: "1.8rem", marginBottom: "8px" }}>🛡️ Tình trạng bảo hành</h1>
        <p style={{ color: "var(--text-muted)" }}>{warrantyItems.length} sản phẩm có thông tin bảo hành</p>
      </div>

      {/* Summary */}
      {warrantyItems.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
          {[
            { icon: "🟢", label: "Đang bảo hành", count: activeCount, color: "#10b981" },
            { icon: "🟡", label: "Sắp hết hạn", count: expiringCount, color: "#f59e0b" },
            { icon: "🔴", label: "Hết bảo hành", count: expiredCount, color: "#ef4444" },
          ].map((s) => (
            <div key={s.icon} style={{ background: "var(--dark-surface)", borderRadius: "14px", padding: "20px", textAlign: "center", border: `1px solid ${s.color}30` }}>
              <div style={{ fontSize: "2rem", marginBottom: "6px" }}>{s.icon}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: s.color, marginBottom: "4px" }}>{s.count}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {warrantyItems.length === 0 ? (
        <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "60px", textAlign: "center", border: "1px dashed rgba(16,185,129,0.3)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🛡️</div>
          <h3 style={{ color: "var(--accent)", marginBottom: "12px" }}>Chưa có thông tin bảo hành</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Thông tin bảo hành sẽ hiện ở đây sau khi bạn có đơn hàng hoàn thành.</p>
          <Link href="/#products" className="btn btn-primary">Xem Sản Phẩm</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {warrantyItems.map((item) => {
            const { label, color, icon, daysLeft } = item.status;
            return (
              <div key={item.id} style={{ background: "var(--dark-surface)", borderRadius: "16px", border: `1px solid ${color}25`, padding: "20px 24px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                {/* Image */}
                <div style={{ width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", background: "var(--dark-bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.image ? <img src={item.image} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.8rem" }}>📦</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: "4px" }}>{item.productName}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginBottom: "4px" }}>
                    Đơn hàng: <span style={{ color: "var(--accent)" }}>{item.orderCode}</span> · Mua ngày {new Date(item.purchaseDate).toLocaleDateString("vi-VN")}
                  </div>
                  <div style={{ color: "var(--primary)", fontSize: "0.83rem" }}>🛡️ {item.warrantyText}</div>
                </div>

                {/* Expiry info */}
                <div style={{ textAlign: "right", minWidth: "140px" }}>
                  {item.expiryDate && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "4px" }}>
                      Hết hạn: <strong style={{ color: "var(--text)" }}>{new Date(item.expiryDate).toLocaleDateString("vi-VN")}</strong>
                    </div>
                  )}
                  {daysLeft !== null && daysLeft > 0 && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Còn {daysLeft} ngày</div>
                  )}
                </div>

                {/* Status badge */}
                <span style={{ padding: "6px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "0.85rem", background: `${color}20`, color, border: `1px solid ${color}40`, whiteSpace: "nowrap" }}>
                  {icon} {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "32px", padding: "16px 20px", background: "rgba(16,185,129,0.05)", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.15)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          💡 <strong style={{ color: "var(--primary)" }}>Thông tin:</strong> Thời hạn bảo hành được tính từ ngày đặt hàng.
          Nếu có vấn đề về bảo hành, hãy liên hệ <a href="tel:0789968888" style={{ color: "var(--primary)" }}>0789.96.8888 - 0901.096.096</a>.
        </p>
      </div>
    </div>
  );
}
