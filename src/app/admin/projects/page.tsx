import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Edit } from "lucide-react";
import DeleteProjectButton from "./DeleteProjectButton";

const prisma = new PrismaClient();

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      customer: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title">
          Quản lý Dự án Lắp đặt
        </div>
        <Link href="/admin/projects/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          + Tạo Dự án
        </Link>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Dự án</th>
              <th>Khách hàng</th>
              <th>Trạng thái</th>
              <th>Chi phí dự kiến</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td><strong>{p.name}</strong></td>
                <td>{p.customer?.name || "N/A"}</td>
                <td>
                  <span className={`badge ${p.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
                    {p.status === 'completed' ? 'Hoàn thành' : (p.status === 'in_progress' ? 'Đang thi công' : 'Đang xử lý')}
                  </span>
                </td>
                <td style={{ color: 'var(--primary-light)', fontWeight: 'bold' }}>
                  {(new Intl.NumberFormat('en-US').format(p.totalCost) + ' đ')}
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/projects/${p.id}`} className="btn btn-action" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--primary-light)' }}>
                      <Edit size={16} />
                    </Link>
                    <DeleteProjectButton projectId={p.id} projectName={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Chưa có dự án nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
