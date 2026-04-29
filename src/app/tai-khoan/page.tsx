import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: "Chờ xác nhận", color: "#f59e0b" },
  processing:  { label: "Đang xử lý",   color: "#3b82f6" },
  completed:   { label: "Hoàn thành",   color: "#10b981" },
  cancelled:   { label: "Đã hủy",       color: "#ef4444" },
  draft:       { label: "Khởi tạo",     color: "#6b7280" },
  quoted:      { label: "Đã báo giá",   color: "#8b5cf6" },
  in_progress: { label: "Đang thi công",color: "#3b82f6" },
};

export default async function TaiKhoanPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/dang-nhap");
  const session = await verifyCustomerToken(token);
  if (!session || !session.customerId) redirect("/dang-nhap");

  const customerId = session.customerId as number;

  const [orders, projects] = await Promise.all([
    prisma.order.findMany({
      where: { customerId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.project.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const totalOrders = await prisma.order.count({ where: { customerId } });
  const totalProjects = await prisma.project.count({ where: { customerId } });
  const warrantyItems = orders.flatMap(o => o.items).filter(i => i.warrantyNote || i.product.warranty);

  const stats = [
    { icon: "📦", label: "Đơn hàng", value: totalOrders, href: "/tai-khoan/don-hang", color: "#3b82f6" },
    { icon: "🏗️", label: "Dự án",    value: totalProjects, href: "/tai-khoan/du-an",  color: "#8b5cf6" },
    { icon: "🛡️", label: "Sản phẩm bảo hành", value: warrantyItems.length, href: "/tai-khoan/bao-hanh", color: "#10b981" },
  ];

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ color: "var(--accent)", fontSize: "1.8rem", marginBottom: "8px" }}>
          Xin chào, {session.name}! 👋
        </h1>
        <p style={{ color: "var(--text-muted)" }}>Theo dõi đơn hàng, dự án và bảo hành sản phẩm của bạn tại đây.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        {stats.map((s) => (
          <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "24px", border: `1px solid ${s.color}30`, transition: "transform 0.2s, border-color 0.2s" }}>
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{s.icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: s.color, marginBottom: "4px" }}>{s.value}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ color: "var(--accent)", fontSize: "1.2rem" }}>📦 Đơn hàng gần nhất</h2>
          <Link href="/tai-khoan/don-hang" style={{ color: "var(--primary)", fontSize: "0.9rem", textDecoration: "none" }}>Xem tất cả →</Link>
        </div>

        {orders.length === 0 ? (
          <div style={{ background: "var(--dark-surface)", borderRadius: "14px", padding: "32px", textAlign: "center", color: "var(--text-muted)", border: "1px solid rgba(16,185,129,0.1)" }}>
            Bạn chưa có đơn hàng nào.{" "}
            <Link href="/#products" style={{ color: "var(--primary)" }}>Mua sắm ngay</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {orders.map((order) => {
              const st = STATUS_LABELS[order.status] ?? { label: order.status, color: "#6b7280" };
              return (
                <div key={order.id} style={{ background: "var(--dark-surface)", borderRadius: "14px", padding: "20px 24px", border: "1px solid rgba(16,185,129,0.1)", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: "4px" }}>{order.orderCode}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")} · {order.items.length} sản phẩm
                    </div>
                  </div>
                  <div style={{ color: "var(--primary)", fontWeight: 700 }}>
                    {new Intl.NumberFormat("vi-VN").format(order.total)}đ
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40` }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Projects */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ color: "var(--accent)", fontSize: "1.2rem" }}>🏗️ Dự án lắp đặt</h2>
          <Link href="/tai-khoan/du-an" style={{ color: "var(--primary)", fontSize: "0.9rem", textDecoration: "none" }}>Xem tất cả →</Link>
        </div>

        {projects.length === 0 ? (
          <div style={{ background: "var(--dark-surface)", borderRadius: "14px", padding: "32px", textAlign: "center", color: "var(--text-muted)", border: "1px solid rgba(16,185,129,0.1)" }}>
            Bạn chưa có dự án lắp đặt nào.{" "}
            <Link href="/du-an" style={{ color: "var(--primary)" }}>Đăng ký ngay</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {projects.map((p) => {
              const st = STATUS_LABELS[p.status] ?? { label: p.status, color: "#6b7280" };
              const steps = ["draft", "quoted", "in_progress", "completed"];
              const stepIdx = steps.indexOf(p.status);
              return (
                <div key={p.id} style={{ background: "var(--dark-surface)", borderRadius: "14px", padding: "20px 24px", border: "1px solid rgba(16,185,129,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: "4px" }}>{p.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{new Date(p.createdAt).toLocaleDateString("vi-VN")}</div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40` }}>
                      {st.label}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    {steps.map((s, i) => (
                      <div key={s} style={{ flex: 1, height: "6px", borderRadius: "3px", background: i <= stepIdx ? "var(--primary)" : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                    {["Khởi tạo", "Báo giá", "Thi công", "Hoàn thành"].map((l, i) => (
                      <span key={l} style={{ fontSize: "0.7rem", color: i <= stepIdx ? "var(--primary)" : "var(--text-muted)" }}>{l}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
