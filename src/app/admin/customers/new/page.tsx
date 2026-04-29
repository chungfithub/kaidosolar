"use client";

import Link from "next/link";
import { saveCustomer } from "@/app/actions/customer";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

export default function NewCustomerPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '20px' }}>👤</span>
          Thêm Khách Hàng
        </h1>
        <Link href="/admin/customers" className="btn-back">
          <ChevronLeft size={16} /> Quay lại
        </Link>
      </div>

      <form action={(formData) => {
        setIsSubmitting(true);
        saveCustomer(formData);
      }} className="form-grid">
        
        {/* Main Column */}
        <div className="column-main">
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: '18px' }}>📋</span> Thông tin liên hệ
            </div>
            
            <div className="form-group">
              <label>Họ và Tên <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" name="name" className="form-control" required />
            </div>
            
            <div className="form-group">
              <label>Số điện thoại <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="tel" name="phone" className="form-control" required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" className="form-control" />
            </div>

            <div className="form-group">
              <label>Địa chỉ</label>
              <textarea name="address" className="form-control" rows={3}></textarea>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="column-sidebar">
          <div className="card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Lưu Khách Hàng"}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '12px', marginBottom: 0 }}>
              Khách hàng mới sẽ được thêm vào danh bạ
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
