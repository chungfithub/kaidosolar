import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Box, HardHat, FileText } from 'lucide-react';
import ProjectDashboardClient from './ProjectDashboardClient';
import StatusUpdater from './StatusUpdater';

const prisma = new PrismaClient();

export default async function ProjectDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idStr = resolvedParams.id;
  
  if (!idStr) notFound();
  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: { product: true }
      },
      installers: {
        include: { installer: true }
      }
    }
  });

  if (!project) notFound();

  // Fetch all available products and installers for the dropdowns
  const availableProducts = await prisma.product.findMany({ orderBy: { name: 'asc' }});
  const availableInstallers = await prisma.installer.findMany({ orderBy: { name: 'asc' }});

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title">
          Chi tiết dự án: <span style={{ color: 'var(--primary)', marginLeft: '12px' }}>{project.name}</span>
        </div>
        <Link href="/admin/projects" className="btn-back">
          <ArrowLeft size={18} />
          Quay lại danh sách
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* OVERVIEW CARD */}
          <div className="card">
            <div className="card-header">
              <FileText size={20} color="var(--primary)" />
              Thông tin chung
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Khách hàng</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{project.customer.name}</p>
                <p style={{ color: 'var(--text-muted)' }}>{project.customer.phone}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Trạng thái hiện tại</p>
                <StatusUpdater projectId={project.id} currentStatus={project.status} />
              </div>
            </div>
          </div>

          <ProjectDashboardClient 
            project={project} 
            availableProducts={availableProducts}
            availableInstallers={availableInstallers}
          />
          
        </div>

        {/* SIDEBAR WIDGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ background: 'var(--gradient)', color: 'white', border: 'none' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', opacity: 0.9 }}>Tổng chi phí dự kiến</h3>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              {(new Intl.NumberFormat('en-US').format(project.totalCost) + ' đ')}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              Thống kê nhanh
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số loại thiết bị</span>
                <span style={{ fontWeight: 600 }}>{project.items.length}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số thợ tham gia</span>
                <span style={{ fontWeight: 600 }}>{project.installers.length}</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngày tạo</span>
                <span style={{ fontWeight: 600 }}>{new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
