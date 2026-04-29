"use client";

import Link from "next/link";

export default function ProductsHeader() {

  return (
    <>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, marginRight: '8px' }}>Quản lý Sản phẩm</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link 
            href="/admin/products/new-ai" 
            className="btn btn-action" 
            style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            + Thêm Sản Phẩm AI
          </Link>
          <Link href="/admin/products/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            + Thêm Sản Phẩm Mới
          </Link>
        </div>
      </div>
    </>
  );
}
