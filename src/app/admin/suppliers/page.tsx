import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";

const prisma = new PrismaClient();

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Quản lý Nhà Cung Cấp</h3>
        <Link href="/admin/suppliers/new" className="btn btn-primary">+ Thêm Nhà Cung Cấp</Link>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên nhà cung cấp</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Khu vực</th>
              <th>Ghi chú</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td><strong>{s.name}</strong></td>
                <td>
                  <div>{s.phone}</div>
                  {s.zalo && <div style={{ fontSize: "0.85rem", color: "var(--primary)" }}>Zalo: {s.zalo}</div>}
                  {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem", color: "#1877F2" }}>Facebook</a>}
                </td>
                <td>{s.address || "N/A"}</td>
                <td>{s.regions || "N/A"}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{s.notes || "Không có ghi chú"}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-action" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--primary-light)' }}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-action btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Chưa có nhà cung cấp nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
