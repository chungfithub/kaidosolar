"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { saveProduct } from "../../actions/product";
import { Plus, X, UploadCloud, ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import AiProductUploader from "./AiProductUploader";

export default function ProductForm({ product, suppliers, showAiUpload = false }: { product?: any, suppliers: any[], showAiUpload?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Controlled fields for AI autofill
  const [name, setName] = useState(product?.name || "");
  const [brand, setBrand] = useState(product?.brand || "");
  const [capacity, setCapacity] = useState(product?.capacity || "");
  const initialWarranty = product?.warranty || "";
  const initialWarrantyParts = initialWarranty.trim().split(" ");
  const [warrantyNum, setWarrantyNum] = useState(initialWarrantyParts[0] || "");
  const [warrantyUnit, setWarrantyUnit] = useState(initialWarrantyParts[1] || "năm");
  const [stock, setStock] = useState(product?.stock?.toString() || "0");
  const [category, setCategory] = useState(product?.category || "panels");
  const [specs, setSpecs] = useState(product?.specs || "");
  const [aiHighlight, setAiHighlight] = useState(false);
  const [priceStr, setPriceStr] = useState(product?.price ? product.price.toLocaleString("en-US") : "");
  
  useEffect(() => {
    const pendingData = sessionStorage.getItem("pendingAiProduct");
    if (pendingData && !product) {
      try {
        const data = JSON.parse(pendingData);
        handleAiData(data);
        
        // Clean up
        sessionStorage.removeItem("pendingAiProduct");
      } catch (e) {
        console.error("Failed to parse pending AI product data", e);
      }
    }
  }, [product]);

  const handleAiData = (data: any) => {
    if (data.name) setName(data.name);
    if (data.brand) setBrand(data.brand);
    if (data.capacity) setCapacity(data.capacity);
    if (data.warrantyNum) setWarrantyNum(data.warrantyNum);
    if (data.warrantyUnit) setWarrantyUnit(data.warrantyUnit.toLowerCase());
    if (data.category && ["panels", "inverters", "batteries", "accessories"].includes(data.category)) {
      setCategory(data.category);
    }
    if (data.specs) setSpecs(data.specs);
    
    setAiHighlight(true);
    setTimeout(() => setAiHighlight(false), 3000);
  };

  const [images, setImages] = useState<string[]>(product?.images ? JSON.parse(product.images) : []);
  const [supplierPrices, setSupplierPrices] = useState<{supplierId: string, importPrice: string}[]>(
    product?.supplierPrices?.length > 0 
      ? product.supplierPrices.map((sp: any) => ({ supplierId: sp.supplierId.toString(), importPrice: sp.importPrice.toString() }))
      : [{ supplierId: "", importPrice: "" }]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSubmitting(true);
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.url) {
          setImages(prev => [...prev, data.url]);
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    setIsSubmitting(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">
          <span style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '20px' }}>📦</span>
          {product ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm"}
        </h1>
        <Link href="/admin/products" className="btn-back">
          <ChevronLeft size={16} /> Quay lại
        </Link>
      </div>

      <form action={saveProduct} className="form-grid">
        {product && <input type="hidden" name="id" value={product.id} />}
        <input type="hidden" name="images" value={JSON.stringify(images)} />
        <input type="hidden" name="supplierPrices" value={JSON.stringify(supplierPrices.filter(sp => sp.supplierId && sp.importPrice))} />

        {showAiUpload && (
          <div style={{ gridColumn: '1 / -1' }}>
            <AiProductUploader onParsedData={handleAiData} />
          </div>
        )}

        {/* LEFT COLUMN: Main Information */}
        <div className="column-main">
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: '18px' }}>📄</span> Thông tin chung
            </div>
            
            <div className="form-group">
              <label>Tên sản phẩm <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="text" 
                name="name" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="form-control" 
                required 
                style={{
                  transition: 'box-shadow 0.3s ease',
                  boxShadow: aiHighlight ? '0 0 0 2px rgba(16,185,129,0.5)' : 'none'
                }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: '18px' }}>🏢</span> Nhà cung cấp & Giá nhập
            </div>
            
            <div id="supplier-prices-container">
              {supplierPrices.map((sp, index) => (
                <div key={index} className="supplier-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <select 
                      className="form-control" 
                      value={sp.supplierId} 
                      onChange={(e) => {
                        const newSp = [...supplierPrices];
                        newSp[index].supplierId = e.target.value;
                        setSupplierPrices(newSp);
                      }}
                    >
                      <option value="">-- Chọn Nhà Cung Cấp --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Giá nhập" 
                      value={sp.importPrice ? Number(sp.importPrice).toLocaleString("en-US") : ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        const newSp = [...supplierPrices];
                        newSp[index].importPrice = raw;
                        setSupplierPrices(newSp);
                      }}
                    />
                  </div>
                  <button type="button" className="btn-remove-row" style={{ marginTop: 0 }} onClick={() => setSupplierPrices(supplierPrices.filter((_, i) => i !== index))}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <button type="button" className="btn-add-item" onClick={() => setSupplierPrices([...supplierPrices, { supplierId: "", importPrice: "" }])}>
              <Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Thêm Nhà Cung Cấp
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: '18px' }}>💰</span> Giá bán & Hình ảnh
            </div>
            
            <div className="form-group">
              <label>Giá bán (VNĐ) <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={priceStr}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  if (raw) {
                    setPriceStr(parseInt(raw, 10).toLocaleString("en-US"));
                  } else {
                    setPriceStr("");
                  }
                }}
              />
              <input type="hidden" name="price" value={priceStr.replace(/,/g, '')} />
            </div>

            <div className="form-group">
              <label>Thư viện ảnh sản phẩm</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {images.map((imgUrl, index) => (
                  <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <img src={imgUrl} alt={`Product ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,255,255,0.9)', color: 'var(--danger)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Upload Button */}
                <label style={{ aspectRatio: '1', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', color: '#64748b', transition: '.2s' }}>
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isSubmitting} />
                  <UploadCloud size={24} style={{ marginBottom: '4px' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{isSubmitting ? "Đang tải..." : "Thêm ảnh"}</span>
                </label>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bạn có thể chọn nhiều ảnh cùng lúc.</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: '18px' }}>📝</span> Mô tả Thông Số Kỹ Thuật
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea 
                name="specs" 
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                className="form-control" 
                placeholder="Nhập thông tin mô tả chi tiết, thông số kỹ thuật, chế độ bảo hành..." 
                rows={8}
                style={{ 
                  resize: 'vertical', 
                  width: '100%', 
                  padding: '16px', 
                  lineHeight: '1.6',
                  transition: 'box-shadow 0.3s ease',
                  boxShadow: aiHighlight ? '0 0 0 2px rgba(16,185,129,0.5)' : 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings & Actions */}
        <div className="column-sidebar">
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: '18px' }}>⚙️</span> Phân loại & Bán hàng
            </div>

            <div className="form-group">
              <label>Danh mục <span style={{ color: '#ef4444' }}>*</span></label>
              <select 
                name="category" 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-control" 
                required
                style={{
                  transition: 'box-shadow 0.3s ease',
                  boxShadow: aiHighlight ? '0 0 0 2px rgba(16,185,129,0.5)' : 'none'
                }}
              >
                <option value="panels">Tấm Pin Mặt trời</option>
                <option value="inverters">Biến tần - Inverter</option>
                <option value="batteries">Pin Lưu Trữ</option>
                <option value="accessories">Phụ Kiện Lắp đặt</option>
              </select>
            </div>

            <div className="form-group">
              <label>Số lượng trong kho <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="number" 
                name="stock" 
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="form-control" 
                required 
                min="0"
                placeholder="Ví dụ: 15"
              />
            </div>

            <div className="form-group">
              <label>Thương Hiệu</label>
              <input 
                type="text" 
                name="brand" 
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="form-control" 
                placeholder="VD: Huawei, Jinko..." 
                style={{
                  transition: 'box-shadow 0.3s ease',
                  boxShadow: aiHighlight ? '0 0 0 2px rgba(16,185,129,0.5)' : 'none'
                }}
              />
            </div>

            <div className="form-group">
              <label>Công suất / Thông số chính</label>
              <input 
                type="text" 
                name="capacity" 
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="form-control" 
                placeholder="VD: 10kW, 550W, 16kWh..." 
                style={{
                  transition: 'box-shadow 0.3s ease',
                  boxShadow: aiHighlight ? '0 0 0 2px rgba(16,185,129,0.5)' : 'none'
                }}
              />
            </div>

            <div className="form-group">
              <label>Thời gian bảo hành</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  value={warrantyNum}
                  onChange={e => setWarrantyNum(e.target.value)}
                  className="form-control" 
                  placeholder="Số" 
                  style={{
                    flex: 1,
                    transition: 'box-shadow 0.3s ease',
                    boxShadow: aiHighlight ? '0 0 0 2px rgba(16,185,129,0.5)' : 'none'
                  }}
                />
                <select 
                  value={warrantyUnit}
                  onChange={e => setWarrantyUnit(e.target.value)}
                  className="form-control"
                  style={{ 
                    width: '100px', 
                    transition: 'box-shadow 0.3s ease', 
                    boxShadow: aiHighlight ? '0 0 0 2px rgba(16,185,129,0.5)' : 'none' 
                  }}
                >
                  <option value="tháng">tháng</option>
                  <option value="năm">năm</option>
                </select>
              </div>
              <input type="hidden" name="warranty" value={warrantyNum ? `${warrantyNum} ${warrantyUnit}` : ""} />
            </div>
          </div>

          {/* Action Card */}
          <div className="card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Lưu Sản Phẩm"}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '12px', marginBottom: 0 }}>
              Lưu trữ mọi thay đổi vào hệ thống
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
