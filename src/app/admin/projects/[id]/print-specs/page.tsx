import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import PrintTrigger from "@/app/admin/orders/[id]/print/PrintTrigger";

const prisma = new PrismaClient();

// Helper to detect correct unit based on product name
function detectUnit(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("tấm pin") || lower.includes("tam pin") || (lower.includes("pin") && lower.includes("mặt trời"))) {
    return " TẤM";
  }
  if (lower.includes("dây") || lower.includes("day") || lower.includes("dây điện")) {
    return " MÉT";
  }
  if (lower.includes("nhân công") || lower.includes("nhan cong") || lower.includes("lắp đặt")) {
    return ""; // Will just show quantity number
  }
  return "";
}

// Helper to render technical specs nicely in a table cell
function renderSpecsCell(text: string | null) {
  if (!text) return "-";
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return "-";
  return (
    <ul style={{ margin: 0, paddingLeft: '14px', listStyleType: 'disc', fontSize: '11.5px', textAlign: 'left', lineHeight: '1.35' }}>
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
              return <strong key={i} style={{ color: '#000', fontWeight: 'bold' }}>{part}</strong>;
            }
            return part;
          });
        } else if (content.includes(':')) {
          const colonIdx = content.indexOf(':');
          const label = content.substring(0, colonIdx);
          const value = content.substring(colonIdx);
          parts = [
            <strong key="label" style={{ color: '#000', fontWeight: 'bold' }}>{label}</strong>,
            value
          ];
        } else {
          parts = [content];
        }
        return <li key={idx} style={{ marginBottom: '2px' }}>{parts}</li>;
      })}
    </ul>
  );
}

export const dynamic = "force-dynamic";

export default async function PrintProjectQuotationSpecsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectIdStr = resolvedParams.id;
  
  if (!projectIdStr) {
    notFound();
  }
  
  const projectId = parseInt(projectIdStr, 10);
  if (isNaN(projectId)) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        },
        orderBy: [
          { sortOrder: 'asc' },
          { id: 'asc' }
        ]
      }
    }
  });

  if (!project) {
    notFound();
  }

  const currentDate = new Date();
  const dateString = `Ngày ${currentDate.getDate().toString().padStart(2, '0')} tháng ${currentDate.getMonth() + 1} năm ${currentDate.getFullYear()}`;
  const quotationCode = `BG-PJ-${project.id.toString().padStart(5, '0')}`;

  // Calculate items sum
  const calculatedTotal = project.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      <PrintTrigger label="🖨️ In Báo Giá Dự Án" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 10mm 12mm 10mm 12mm;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
        
        .print-container {
          max-width: 210mm;
          min-height: 297mm;
          margin: 40px auto;
          background: white;
          padding: 15mm 12mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          line-height: 1.4;
        }

        .header-section {
          display: flex;
          border-bottom: 2px solid #e1251b;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        .logo-box {
          flex: 0 0 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .company-info {
          flex: 1;
          padding-left: 20px;
          font-size: 13px;
        }

        .company-name {
          color: #e1251b;
          font-weight: bold;
          font-size: 16px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .quotation-title {
          text-align: center;
          margin: 20px 0 15px 0;
        }

        .quotation-title h1 {
          font-size: 22px;
          margin: 0;
          text-transform: uppercase;
          font-weight: bold;
        }

        .quotation-title p {
          font-style: italic;
          margin: 4px 0 0 0;
          font-size: 14px;
        }

        .customer-info {
          margin-bottom: 20px;
          font-size: 14px;
        }

        .customer-info table {
          width: 100%;
          border: none;
          border-collapse: collapse;
        }

        .customer-info td {
          padding: 4px 0;
          vertical-align: top;
          border: none !important;
        }

        .quotation-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }

        .quotation-table th, .quotation-table td {
          border: 1px solid #000 !important;
          padding: 6px 4px;
          font-size: 12px;
          vertical-align: middle;
        }

        .quotation-table th {
          background-color: #cbd5e1 !important; /* Premium light blue-gray */
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }

        .text-center {
          text-align: center;
        }

        .text-right {
          text-align: right;
        }

        .col-tt {
          color: #1e3a8a; /* Soft blue */
          font-style: italic;
          font-weight: bold;
          text-align: center;
          width: 3%;
        }

        .col-image {
          width: 8%;
          text-align: center;
        }

        .col-image img {
          max-width: 60px;
          max-height: 60px;
          object-fit: contain;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 2px;
        }

        .col-name {
          width: 20%;
          text-align: left;
        }

        .col-brand {
          width: 10%;
          text-align: center;
          font-weight: bold;
        }

        .col-specs {
          width: 28%;
          text-align: left;
        }

        .col-quantity {
          color: #e1251b; /* Red quantity text */
          font-weight: bold;
          text-align: center;
          width: 6%;
          white-space: nowrap;
        }

        .col-price {
          text-align: right;
          width: 8%;
          white-space: nowrap;
        }

        .col-total {
          color: #e1251b; /* Red total amount */
          font-weight: bold;
          text-align: right;
          width: 10%;
          white-space: nowrap;
        }

        .col-warranty {
          text-align: center;
          font-weight: bold;
          font-size: 11px;
          width: 7%;
          text-transform: uppercase;
        }

        .price-gray {
          color: #94a3b8;
          font-weight: normal;
        }

        .note-red {
          color: #e1251b;
          font-style: italic;
          font-weight: 500;
          font-size: 13.5px;
          margin-top: 10px;
          margin-bottom: 20px;
          text-align: center;
        }

        .footer-notes {
          font-size: 13.5px;
          margin-bottom: 30px;
        }

        .signature-section {
          display: flex;
          justify-content: space-between;
          text-align: center;
          margin-top: 40px;
        }

        .signature-box {
          width: 45%;
          font-size: 14px;
        }
      `}} />

      <div className="print-container">
        {/* Header */}
        <div className="header-section">
          <div className="logo-box">
            <img src="/logo.jpg" alt="Kaido Solar Logo" style={{ maxWidth: '100%', maxHeight: '75px', objectFit: 'contain' }} />
          </div>
          <div className="company-info">
            <div className="company-name">CÔNG TY TNHH KAIDO SOLAR</div>
            <div><strong>Địa chỉ:</strong> Xã Thổ Tang - Tỉnh Phú Thọ</div>
            <div><strong>Hotline:</strong> 0901.096.096 - <strong>Zalo:</strong> 0901.096.096</div>
            <div><strong>Email:</strong> contact@kaidosolar.com - <strong>Website:</strong> www.kaidosolar.com</div>
          </div>
        </div>

        {/* Title */}
        <div className="quotation-title">
          <h1>BẢNG BÁO GIÁ CHI TIẾT DỰ ÁN</h1>
          <p>({dateString})</p>
        </div>

        {/* Customer Info */}
        <div className="customer-info">
          <table>
            <tbody>
              <tr>
                <td style={{ width: '15%' }}>Khách Hàng:</td>
                <td style={{ width: '45%' }}><strong>{project.customer?.name || "..........................................................."}</strong></td>
                <td style={{ width: '15%' }}>Mã dự án:</td>
                <td style={{ width: '25%' }}><strong>{quotationCode}</strong></td>
              </tr>
              <tr>
                <td>Địa chỉ:</td>
                <td>{project.customer?.address || "..........................................................."}</td>
                <td>Điện thoại:</td>
                <td>{project.customer?.phone || "..........................................................."}</td>
              </tr>
              {project.customer?.email && (
                <tr>
                  <td>Email:</td>
                  <td>{project.customer?.email}</td>
                  <td>Tên dự án:</td>
                  <td><strong>{project.name}</strong></td>
                </tr>
              )}
            </tbody>
          </table>
          <p style={{ marginTop: '12px', marginBottom: '8px' }}>
            Kaido Solar trân trọng gửi tới Quý Khách hàng bảng báo giá hệ thống điện năng lượng mặt trời kèm thông số kỹ thuật chi tiết dưới đây:
          </p>
        </div>

        {/* Product Quotation Table */}
        <table className="quotation-table">
          <thead>
            <tr>
              <th className="col-tt" style={{ color: '#1e3a8a' }}>TT</th>
              <th>HÌNH ẢNH</th>
              <th>TÊN SẢN PHẨM</th>
              <th>THƯƠNG HIỆU</th>
              <th>THÔNG SỐ KỸ THUẬT</th>
              <th style={{ color: '#e1251b' }}>SL</th>
              <th>ĐƠN GIÁ</th>
              <th>THÀNH TIỀN</th>
              <th>BẢO HÀNH</th>
            </tr>
          </thead>
          <tbody>
            {project.items.map((item, index) => {
              // Parse product image
              let firstImage = null;
              if (item.product.images) {
                try {
                  const parsed = JSON.parse(item.product.images);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    firstImage = parsed[0];
                  }
                } catch (e) {}
              }

              const hasAmount = item.quantity > 0 && item.price > 0;
              const amountValue = item.price * item.quantity;

              return (
                <tr key={item.id}>
                  <td className="col-tt">{index + 1}</td>
                  <td className="col-image">
                    {firstImage && <img src={firstImage} alt={item.product.name} />}
                  </td>
                  <td className="col-name">
                    <strong style={{ fontSize: '13.5px' }}>{item.product.name}</strong>
                  </td>
                  <td className="col-brand">
                    {item.product.brand || "-"}
                  </td>
                  <td className="col-specs">
                    {renderSpecsCell(item.product.specs)}
                  </td>
                  <td className="col-quantity">
                    {item.quantity}{detectUnit(item.product.name)}
                  </td>
                  <td className="col-price">
                    {item.price.toLocaleString('en-US')}
                  </td>
                  <td className={hasAmount ? "col-total" : "col-total price-gray"}>
                    {hasAmount ? amountValue.toLocaleString('en-US') : "-"}
                  </td>
                  <td className="col-warranty">
                    {item.product.warranty ? item.product.warranty.toUpperCase() : "-"}
                  </td>
                </tr>
              );
            })}
            
            {project.items.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  Chưa có sản phẩm / thiết bị nào được cấu hình trong bảng vật tư dự án.
                </td>
              </tr>
            )}

            {/* Total Row */}
            <tr>
              <td colSpan={7} style={{ textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase', paddingRight: '10px' }}>
                TỔNG CỘNG
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '15px', color: '#000' }}>
                {calculatedTotal.toLocaleString('en-US')}
              </td>
              <td></td>
            </tr>

            {/* Final Cost Row */}
            <tr style={{ backgroundColor: '#fcf8e3' }}>
              <td colSpan={7} style={{ textAlign: 'center', fontWeight: 'bold', color: '#e1251b', textTransform: 'uppercase', padding: '10px' }}>
                TỔNG CỘNG TIỀN CẦN THANH TOÁN
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#e1251b', fontSize: '16px' }}>
                {calculatedTotal.toLocaleString('en-US')}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {/* Note under Table */}
        <div className="note-red">
          Lưu ý: Dây DC chuyên dụng và dây điện lưới AC, khung giàn tính tiếp sau khi hoàn thành
        </div>

        {/* Footer Notes & Terms */}
        <div className="footer-notes">
          <p><strong>Ghi chú & Điều khoản bảo hành:</strong></p>
          <ul style={{ margin: '5px 0 15px 0', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Báo giá trên là bảng giá dự toán vật tư thiết bị cho dự án <strong>{project.name}</strong>. Chi phí thực tế sẽ quyết toán theo khối lượng nghiệm thu thực tế sau khi thi công.</li>
            <li>Chính sách bảo hành thiết bị chính hãng theo đúng quy định hiển thị tại cột Bảo hành.</li>
            {project.notes && <li><strong>Ghi chú dự án:</strong> {project.notes}</li>}
          </ul>
        </div>

        {/* Signatures */}
        <div className="signature-section">
          <div className="signature-box">
            <strong>ĐẠI DIỆN KHÁCH HÀNG</strong>
            <p style={{ fontStyle: 'italic', fontSize: '12px', marginTop: '5px', color: '#475569' }}>(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="signature-box">
            <strong>ĐẠI DIỆN KAIDO SOLAR</strong>
            <p style={{ fontStyle: 'italic', fontSize: '12px', marginTop: '5px', color: '#475569' }}>(Ký và ghi rõ họ tên)</p>
            <div style={{ height: '70px' }}></div>
            <strong style={{ textTransform: 'uppercase' }}>CÔNG TY TNHH KAIDO SOLAR</strong>
          </div>
        </div>
      </div>
    </>
  );
}
