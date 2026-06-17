import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Box, HardHat, FileText, Printer } from 'lucide-react';
import ProjectDashboardClient from './ProjectDashboardClient';
import StatusUpdater from './StatusUpdater';
import RenameProjectTitle from './RenameProjectTitle';
import CustomerUpdater from './CustomerUpdater';

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
        include: { product: true, supplier: true },
        orderBy: [
          { sortOrder: 'asc' },
          { id: 'asc' }
        ]
      },
      installers: {
        include: { installer: true }
      }
    }
  });

  if (!project) notFound();

  // Fetch all available products, installers, suppliers and customers
  const availableProducts = await prisma.product.findMany({ orderBy: { name: 'asc' }});
  const availableInstallers = await prisma.installer.findMany({ orderBy: { name: 'asc' }});
  const availableSuppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' }});
  const availableCustomers = await prisma.customer.findMany({ orderBy: { name: 'asc' }});

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title" style={{ display: 'flex', alignItems: 'center' }}>
          Chi tiết dự án: <RenameProjectTitle projectId={project.id} initialName={project.name} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/admin/projects/${project.id}/contract`} target="_blank" className="btn btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', color: 'white', fontWeight: 600 }}>
            <Printer size={18} />
            Xuất Hợp Đồng
          </Link>
          <Link href={`/admin/projects/${project.id}/invoice`} target="_blank" className="btn btn-primary" style={{ background: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', color: 'white', fontWeight: 600 }}>
            <Printer size={18} />
            Xuất Hóa Đơn
          </Link>
          <Link href={`/admin/projects/${project.id}/print`} target="_blank" className="btn btn-primary" style={{ background: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', color: 'white', fontWeight: 600 }}>
            <Printer size={18} />
            Xuất Báo Giá (A4)
          </Link>
          <Link href={`/admin/projects/${project.id}/print-specs`} target="_blank" className="btn btn-primary" style={{ background: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', color: 'white', fontWeight: 600 }}>
            <Printer size={18} />
            Xuất Báo Giá Specs
          </Link>
          <Link href="/admin/projects" className="btn-back">
            <ArrowLeft size={18} />
            Quay lại danh sách
          </Link>
        </div>
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
              <div style={{ display: 'flex', width: '100%' }}>
                <CustomerUpdater projectId={project.id} currentCustomer={project.customer} availableCustomers={availableCustomers} />
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
            availableSuppliers={availableSuppliers}
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
