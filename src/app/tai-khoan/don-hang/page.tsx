import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Chờ xác nhận", color: "#f59e0b", bg: "#f59e0b20" },
  processing: { label: "Đang xử lý",   color: "#3b82f6", bg: "#3b82f620" },
  completed:  { label: "Hoàn thành",   color: "#10b981", bg: "#10b98120" },
  cancelled:  { label: "Đã hủy",       color: "#ef4444", bg: "#ef444420" },
};

export default async function DonHangPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/dang-nhap");
  const session = await verifyCustomerToken(token);
  if (!session?.customerId) redirect("/dang-nhap");

  const orders = await prisma.order.findMany({
    where: { customerId: session.customerId as number },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "var(--accent)", fontSize: "1.8rem", marginBottom: "8px" }}>📦 Đơn hàng của bạn</h1>
        <p style={{ color: "var(--text-muted)" }}>{orders.length} đơn hàng</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "60px", textAlign: "center", border: "1px dashed rgba(16,185,129,0.3)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📦</div>
          <h3 style={{ color: "var(--accent)", marginBottom: "12px" }}>Chưa có đơn hàng nào</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Hãy khám phá sản phẩm và đặt hàng đầu tiên!</p>
          <Link href="/#products" className="btn btn-primary">Xem Sản Phẩm</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {orders.map((order) => {
            const st = STATUS_MAP[order.status] ?? { label: order.status, color: "#6b7280", bg: "#6b728020" };
            return (
              <div key={order.id} style={{ background: "var(--dark-surface)", borderRadius: "16px", border: "1px solid rgba(16,185,129,0.1)", overflow: "hidden" }}>
                {/* Order Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.05rem" }}>{order.orderCode}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginLeft: "12px" }}>
                      {new Date(order.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "1.1rem" }}>
                      {new Intl.NumberFormat("vi-VN").format(order.total)}đ
                    </span>
                    <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ padding: "16px 24px" }}>
                  {order.items.map((item) => {
                    let images: string[] = [];
                    try { images = JSON.parse(item.product.images); } catch {}
                    const thumb = images[0] ?? "";
                    return (
                      <div key={item.id} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", background: "var(--dark-bg)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {thumb ? <img src={thumb} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.5rem" }}>📦</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "var(--text)", fontWeight: 500, marginBottom: "4px" }}>{item.product.name}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>
                            Số lượng: {item.quantity} · {new Intl.NumberFormat("vi-VN").format(item.unitPrice)}đ/sp
                          </div>
                          {(item.warrantyNote || item.product.warranty) && (
                            <div style={{ color: "var(--primary)", fontSize: "0.8rem", marginTop: "2px" }}>
                              🛡️ Bảo hành: {item.warrantyNote ?? item.product.warranty}
                            </div>
                          )}
                        </div>
                        <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.95rem" }}>
                          {new Intl.NumberFormat("vi-VN").format(item.unitPrice * item.quantity)}đ
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notes */}
                {order.notes && (
                  <div style={{ padding: "12px 24px 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    📝 Ghi chú: {order.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
