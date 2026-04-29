import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminDashboard() {
  const productCount = await prisma.product.count();
  const projectCount = await prisma.project.count();
  const customerCount = await prisma.customer.count();

  return (
    <div>
      <div className="panel-header">
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Tổng quan hệ thống</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h4>Tổng Sản Phẩm</h4>
            <div className="num">{productCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h4>Tổng Dự Án</h4>
            <div className="num">{projectCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h4>Khách hàng</h4>
            <div className="num">{customerCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h4>Doanh thu ước tính</h4>
            <div className="num" style={{ fontSize: "1.4rem", color: "var(--primary-light)" }}>0đ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
