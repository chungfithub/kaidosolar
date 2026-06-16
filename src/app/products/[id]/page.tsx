import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductActions from './ProductActions';

const prisma = new PrismaClient();

function renderSpecs(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const isList = lines.length > 1 || lines.some(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || l.includes(':'));
  
  if (!isList) {
    return <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{text}</p>;
  }

  return (
    <ul style={{ paddingLeft: '20px', listStyleType: 'disc', margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lines.map((line, idx) => {
        const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
        let content = line;
        if (isBullet) {
          content = line.replace(/^[•\-*]\s*/, '');
        }
        
        let parts: React.ReactNode[];
        if (content.includes('**')) {
          const splitParts = content.split(/\*\*(.*?)\*\*/g);
          parts = splitParts.map((part, i) => {
            if (i % 2 === 1) {
              return <strong key={i} style={{ color: 'var(--text)', fontWeight: 600 }}>{part}</strong>;
            }
            return part;
          });
        } else if (content.includes(':')) {
          const colonIdx = content.indexOf(':');
          const label = content.substring(0, colonIdx);
          const value = content.substring(colonIdx);
          parts = [
            <strong key="label" style={{ color: 'var(--text)', fontWeight: 600 }}>{label}</strong>,
            value
          ];
        } else {
          parts = [content];
        }

        return (
          <li key={idx} style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {parts}
          </li>
        );
      })}
    </ul>
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idStr = resolvedParams.id;
  
  if (!idStr) notFound();

  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const product = await prisma.product.findUnique({
    where: { id }
  });

  if (!product || product.isVisible === false) notFound();

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

              <div style={{ marginBottom: '32px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                {renderSpecs(defaultSpecs)}
                <p style={{ marginTop: '16px' }}>Kaido Solar cam kết cung cấp thiết bị năng lượng mặt trời chất lượng cao, đem lại giải pháp tiết kiệm điện năng tối ưu cho gia đình và doanh nghiệp của bạn.</p>
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

