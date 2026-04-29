import { PrismaClient } from '@prisma/client';
import ProjectForm from './ProjectForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const prisma = new PrismaClient();

export default async function NewProjectPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, phone: true }
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title">
          Khởi tạo Dự án mới
        </div>
        <Link href="/admin/projects" className="btn-back">
          <ArrowLeft size={18} />
          Quay lại
        </Link>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Bắt đầu một dự án điện năng lượng mặt trời mới bằng cách điền các thông tin bên dưới.
      </p>
      
      <div className="form-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px' }}>
        <ProjectForm customers={customers} />
      </div>
    </div>
  );
}
