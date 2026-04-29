import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Eye } from "lucide-react";

const prisma = new PrismaClient();

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { account: true },
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Khách Hàng Liên Hệ</h3>
        <Link href="/admin/customers/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
          + Thêm Khách Hàng
        </Link>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ Tên</th>
              <th>Số Điện Thoại</th>
              <th>Email</th>
              <th>Địa chỉ</th>
              <th>Tài khoản web</th>
              <th>Ngày tham gia</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>#{c.id}</td>
                <td><strong>{c.name}</strong></td>
                <td>{c.phone}</td>
                <td>{c.email || "N/A"}</td>
                <td>{c.address || "N/A"}</td>
                <td>
                  {c.account ? (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600,
                      background: c.account.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)",
                      color: c.account.status === "active" ? "#10b981" : "#ef4444",
                      border: `1px solid ${c.account.status === "active" ? "#10b98140" : "#ef444440"}`,
                    }}>
                      <span style={{ fontSize: "0.6rem" }}>●</span>
                      {c.account.status === "active" ? "Đã liên kết" : "Bị khóa"}
                    </span>
                  ) : (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 600,
                      background: "rgba(107,114,128,0.12)", color: "#6b7280", border: "1px solid #6b728040",
                    }}>
                      <span style={{ fontSize: "0.6rem" }}>●</span>
                      Chưa có
                    </span>
                  )}
                </td>
                <td>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <button className="btn btn-action" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }} title="Chi tiết">
                        <Eye size={16} />
                      </button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  Chưa có khách hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
