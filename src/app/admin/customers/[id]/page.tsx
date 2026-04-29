import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, FolderKanban } from "lucide-react";
import CustomerDetailClient from "./CustomerDetailClient";

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

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = parseInt(id);
  if (isNaN(customerId)) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      account: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: true },
      },
      projects: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!customer) notFound();

  return (
    <div className="panel" style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <Link
          href="/admin/customers"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            color: "var(--text-muted)", textDecoration: "none", fontSize: "0.88rem",
            marginBottom: "14px",
          }}
        >
          <ArrowLeft size={15} /> Quay lại danh sách
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ color: "var(--accent)", fontSize: "1.5rem", marginBottom: "4px" }}>
              {customer.name}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              #{customer.id} · {customer.phone} · Tham gia {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
      </div>

      {/* Client-side form: edit info + account management */}
      <CustomerDetailClient
        customerId={customer.id}
        initialName={customer.name}
        initialPhone={customer.phone}
        initialEmail={customer.email ?? ""}
        initialAddress={customer.address ?? ""}
        account={customer.account ? {
          id: customer.account.id,
          email: customer.account.email,
          status: customer.account.status,
          createdAt: customer.account.createdAt,
        } : null}
      />

      {/* ── Lịch sử đơn hàng ── */}
      <section style={{
        background: "var(--dark-surface)", borderRadius: "16px", padding: "24px",
        border: "1px solid rgba(16,185,129,0.1)", marginTop: "28px",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent)", marginBottom: "16px" }}>
          <Package size={16} style={{ display: "inline", marginRight: "6px" }} />
          Đơn hàng ({customer.orders.length})
        </h2>
        {customer.orders.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Chưa có đơn hàng nào.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {customer.orders.map((order) => {
              const st = STATUS_LABELS[order.status] ?? { label: order.status, color: "#6b7280" };
              return (
                <div key={order.id} style={{
                  display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
                  padding: "12px 16px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.9rem" }}>{order.orderCode}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")} · {order.items.length} sản phẩm
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>
                    {new Intl.NumberFormat("vi-VN").format(order.total)}đ
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600,
                    background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40`,
                  }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Dự án ── */}
      <section style={{
        background: "var(--dark-surface)", borderRadius: "16px", padding: "24px",
        border: "1px solid rgba(16,185,129,0.1)", marginTop: "16px",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent)", marginBottom: "16px" }}>
          <FolderKanban size={16} style={{ display: "inline", marginRight: "6px" }} />
          Dự án lắp đặt ({customer.projects.length})
        </h2>
        {customer.projects.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Chưa có dự án nào.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {customer.projects.map((p) => {
              const st = STATUS_LABELS[p.status] ?? { label: p.status, color: "#6b7280" };
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
                  padding: "12px 16px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.9rem" }}>{p.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600,
                    background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40`,
                  }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
