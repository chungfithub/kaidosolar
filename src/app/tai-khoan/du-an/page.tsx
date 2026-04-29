import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

const STEPS = [
  { key: "draft",       label: "Khởi tạo",    icon: "📝" },
  { key: "quoted",      label: "Đã báo giá",   icon: "💰" },
  { key: "in_progress", label: "Đang thi công", icon: "🔧" },
  { key: "completed",   label: "Hoàn thành",   icon: "✅" },
];

const STATUS_COLOR: Record<string, string> = {
  draft: "#6b7280", quoted: "#8b5cf6", in_progress: "#3b82f6", completed: "#10b981",
};

export default async function DuAnPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect("/dang-nhap");
  const session = await verifyCustomerToken(token);
  if (!session?.customerId) redirect("/dang-nhap");

  const projects = await prisma.project.findMany({
    where: { customerId: session.customerId as number },
    include: {
      installers: { include: { installer: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "var(--accent)", fontSize: "1.8rem", marginBottom: "8px" }}>🏗️ Dự án lắp đặt</h1>
        <p style={{ color: "var(--text-muted)" }}>{projects.length} dự án · <Link href="/du-an" style={{ color: "var(--primary)" }}>Đăng ký dự án mới →</Link></p>
      </div>

      {projects.length === 0 ? (
        <div style={{ background: "var(--dark-surface)", borderRadius: "16px", padding: "60px", textAlign: "center", border: "1px dashed rgba(16,185,129,0.3)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🏗️</div>
          <h3 style={{ color: "var(--accent)", marginBottom: "12px" }}>Chưa có dự án nào</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Đăng ký dự án lắp đặt để được tư vấn miễn phí!</p>
          <Link href="/du-an" className="btn btn-primary">Đăng Ký Dự Án</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {projects.map((project) => {
            const stepIdx = STEPS.findIndex((s) => s.key === project.status);
            const color = STATUS_COLOR[project.status] ?? "#6b7280";
            const currentStep = STEPS[stepIdx] ?? STEPS[0];

            return (
              <div key={project.id} style={{ background: "var(--dark-surface)", borderRadius: "16px", border: `1px solid ${color}30`, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ color: "var(--text)", fontWeight: 700, marginBottom: "6px", fontSize: "1.05rem" }}>{project.name}</h3>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Tạo ngày {new Date(project.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  <span style={{ padding: "6px 16px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }}>
                    {currentStep.icon} {currentStep.label}
                  </span>
                </div>

                {/* Progress */}
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", gap: "0", marginBottom: "8px" }}>
                    {STEPS.map((step, i) => {
                      const done = i <= stepIdx;
                      const isCurrent = i === stepIdx;
                      return (
                        <div key={step.key} style={{ flex: 1, position: "relative" }}>
                          {/* Line */}
                          {i < STEPS.length - 1 && (
                            <div style={{ position: "absolute", top: "15px", left: "50%", width: "100%", height: "3px", background: i < stepIdx ? "var(--primary)" : "rgba(255,255,255,0.1)", zIndex: 0 }} />
                          )}
                          {/* Circle */}
                          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: done ? "var(--primary)" : "rgba(255,255,255,0.1)", border: isCurrent ? `3px solid var(--primary)` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, color: done ? "#fff" : "var(--text-muted)", boxShadow: isCurrent ? "0 0 10px rgba(16,185,129,0.5)" : "none" }}>
                              {done ? (i < stepIdx ? "✓" : step.icon) : i + 1}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: done ? "var(--primary)" : "var(--text-muted)", textAlign: "center", fontWeight: done ? 600 : 400 }}>
                              {step.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Installers */}
                {project.installers.length > 0 && (
                  <div style={{ padding: "0 24px 16px" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>👷 Kỹ thuật viên phụ trách:</div>
                    {project.installers.map((pi) => (
                      <div key={pi.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", padding: "4px 12px", marginRight: "8px", fontSize: "0.85rem" }}>
                        <span>🔧</span>
                        <span style={{ color: "var(--text)" }}>{pi.installer.name}</span>
                        <span style={{ color: "var(--text-muted)" }}>· {pi.installer.phone}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Items */}
                {project.items.length > 0 && (
                  <div style={{ padding: "0 24px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "12px 0 8px" }}>📦 Thiết bị dự án:</div>
                    {project.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text)", padding: "4px 0" }}>
                        <span>{item.product.name}</span>
                        <span style={{ color: "var(--text-muted)" }}>× {item.quantity}</span>
                      </div>
                    ))}
                    {project.totalCost > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", fontWeight: 700 }}>
                        <span style={{ color: "var(--text)" }}>Tổng chi phí:</span>
                        <span style={{ color: "var(--primary)" }}>{new Intl.NumberFormat("vi-VN").format(project.totalCost)}đ</span>
                      </div>
                    )}
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
