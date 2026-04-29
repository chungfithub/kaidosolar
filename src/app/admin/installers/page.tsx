import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";

const prisma = new PrismaClient();

export default async function InstallersPage() {
  const installers = await prisma.installer.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Quản lý Thợ Lắp Đặt</h3>
        <Link href="/admin/installers/new" className="btn btn-primary">+ Thêm Thợ Lắp Đặt</Link>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Đội Thợ</th>
              <th>Số điện thoại</th>
              <th>Khu vực</th>
              <th>Kinh nghiệm / Ghi chú</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {installers.map(i => (
              <tr key={i.id}>
                <td>#{i.id}</td>
                <td><strong>{i.name}</strong></td>
                <td>{i.phone}</td>
                <td>{i.regions || "N/A"}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{i.notes || "Không có ghi chú"}</td>
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
            {installers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Chưa có thợ lắp đặt nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
