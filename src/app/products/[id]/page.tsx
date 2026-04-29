import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductActions from './ProductActions';

const prisma = new PrismaClient();

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idStr = resolvedParams.id;
  
  if (!idStr) notFound();

  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const product = await prisma.product.findUnique({
    where: { id }
  });

  if (!product) notFound();

  let images: string[] = [];
  try {
    images = JSON.parse(product.images);
  } catch (e) {
    // ignore
  }

  const thumb = images.length > 0 ? images[0] : "";

  // Fake specs logic to make it look realistic if not present
  const defaultSpecs = product.specs || "Sản phẩm chính hãng, bảo hành 12 năm. Hiệu suất cao, thiết kế bền bỉ với thời tiết khắc nghiệt.";

  return (
    <>
      <nav className="navbar scrolled">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="nav-logo">Kaido <span>Solar</span></Link>
          <ul className="nav-links">
            <li><Link href="/#products">← Trở về Danh mục</Link></li>
          </ul>
        </div>
      </nav>

      <div className="product-detail-page">
        <div className="pd-container">
          <div className="pd-breadcrumb">
            <Link href="/">Trang chủ</Link> <span style={{ margin: '0 8px' }}>/</span> 
            <Link href="/#products">Sản phẩm</Link> <span style={{ margin: '0 8px' }}>/</span> 
            <span style={{ color: 'var(--text)' }}>{product.category}</span>
          </div>

          <div className="pd-grid">
            <div className="pd-gallery">
              {thumb ? (
                <img src={thumb} alt={product.name} />
              ) : (
                <div className="pd-gallery-placeholder">📦</div>
              )}
            </div>

            <div className="pd-info">
              <div className="pd-category">{product.category}</div>
              <h1 className="pd-title">{product.name}</h1>
              
              <div className="pd-price">
                {new Intl.NumberFormat('en-US').format(product.price)}đ
              </div>

              <div className="pd-specs-card">
                <h3 className="pd-specs-title">Thông số nổi bật</h3>
                <ul className="pd-specs-list">
                  <li>
                    <span>Thương hiệu</span>
                    <span>{product.brand || 'Chính hãng'}</span>
                  </li>
                  <li>
                    <span>Tình trạng</span>
                    <span>Mới 100%</span>
                  </li>
                  <li>
                    <span>Bảo hành</span>
                    <span>{product.warranty || 'Lên tới 12 năm'}</span>
                  </li>
                  {product.capacity && (
                    <li>
                      <span>Công suất</span>
                      <span>{product.capacity}</span>
                    </li>
                  )}
                  <li>
                    <span>Tồn kho</span>
                    <span style={{ color: product.stock > 0 ? 'var(--primary)' : '#ef4444' }}>
                      {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
                    </span>
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '32px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '12px' }}>Mô tả sản phẩm</h3>
                <p>{defaultSpecs}</p>
                <p style={{ marginTop: '12px' }}>Kaido Solar cam kết cung cấp thiết bị năng lượng mặt trời chất lượng cao, đem lại giải pháp tiết kiệm điện năng tối ưu cho gia đình và doanh nghiệp của bạn.</p>
              </div>

              <ProductActions product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: thumb,
                category: product.category,
                specs: defaultSpecs,
              }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

